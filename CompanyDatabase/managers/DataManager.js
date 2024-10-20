import Database from 'better-sqlite3';

import path from 'path';
import fs from 'fs';

import { ROOT, DATABASE_FILENAME, DATABASE_ARCHIVE_FOLDER } from "#config";

/**
 * Error codes
 * @type {{SQLITE_CONSTRAINT_UNIQUE: string, CONFIG_NOT_FOUND: string, COMPANY_NOT_FOUND: string}}
 */
export const ErrorCodes = {
    SQLITE_CONSTRAINT_UNIQUE: "SQLITE_CONSTRAINT_UNIQUE",
    CONFIG_NOT_FOUND: "CONFIG_NOT_FOUND",
    COMPANY_NOT_FOUND: "COMPANY_NOT_FOUND"
}

class DatabaseError extends Error {
    /**
     * Constructor for a DatabaseError
     * @param {string} message - A human-readable error message
     * @param {string} code - An error code defined in ErrorCodes Object
     */
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}


class DataManager {
    /**
     * Database file path
     * @type {string}
     */
    #dbFilePath;

    /**
     * Database object
     * @type {Database.Database}
     */
    #db;
    constructor() {
        this.#dbFilePath = path.join(ROOT, DATABASE_FILENAME);

        /**
         * Is Database file created or read
         * True if created, False if already exists and just read
         * @type {boolean}
         */
        this.isDatabaseCreated = !fs.existsSync(this.#dbFilePath);

        this.#db = new Database(this.#dbFilePath);

        // if database is just created, skip validation.
        // if validation fails, move old db file to archive directory.
        if (!this.isDatabaseCreated && !this.#validateDatabase()) {
            // Create archive folder if it doesnt exists
            !fs.existsSync(DATABASE_ARCHIVE_FOLDER) && fs.mkdirSync(DATABASE_ARCHIVE_FOLDER, {recursive: true});

            // Move database file
            this.#db.close();
            fs.renameSync(this.#dbFilePath, path.join(DATABASE_ARCHIVE_FOLDER, `${Date.now()}-${DATABASE_FILENAME}`));

            // Re-create empty database.
            this.#db = new Database(this.#dbFilePath);
            this.isDatabaseCreated = true;
        }

        if (this.isDatabaseCreated) {
            this.#initializeDatabase();
        }

        this.#prepareMethods();
    }

    /**
     * Checks if database is intact.
     * 
     * Details:
     * 
     * If either checksum or salt is available in config table, other should be available too. If not, database is corrupted.
     * If companies table have keys but either checksum or salt is missing, database is corrupted. 
     * @returns {bool} Returns true if the database is intact, false if corrupted.
     */
    #validateDatabase() {
        const checkTableStatement = this.#db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?");
        
        const isCompaniesExists = checkTableStatement.get('companies');
        const isConfigExists = checkTableStatement.get('config');
        
        const configCount = isConfigExists ? this.#db.prepare("SELECT COUNT(*) AS non_null_count FROM config WHERE value IS NOT NULL;").get().non_null_count : 0;
        const companyCount = isCompaniesExists ? this.#db.prepare("SELECT COUNT(*) AS company_count FROM companies;").get().company_count : 0;

        // This logic may be rewrited in the future if I need to store more config variables with different requirements.
        if ([0, 2].indexOf(configCount) < 0) {
            return false;
        }

        if (companyCount > 0 && configCount == 0) {
            return false;
        }

        return true;
    }

    /**
     * Inserts data to config table
     * @type {Database.Statement<[string, string]>}
     */
    #setConfig;

    /**
     * Gets config variable by key from config table
     * @type {Database.Statement<[string], {key: string, value: string}>}
     */
    #getConfig

    /**
     * Gets all the companies.
     * @type {Database.Statement<[],{id: number, fake_name: string, real_name: string, info: string?}>}
     */
    #getCompanies

    /**
     * Get company by id
     * @type {Database.Statement<[number], {id: number, fake_name: string, real_name: string, info: string?}>}
     */
    #getCompany
    /**
     * Inserts new company to company table
     * @type {Database.Statement<[string, string, string?]>}
     */
    #insertCompany

    /**
     * Deletes company from company table
     * @type {Database.Statement<[string]>}
     */
    #removeCompany

    /**
     * Updates company at company table
     * @type {Database.Statement<[string, string, string, string]>}
     */
    #updateCompany

    /**
     * This function prepares database statements for quick execution in the future.
     */
    #prepareMethods() {
        this.#setConfig = this.#db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
        this.#getConfig = this.#db.prepare('SELECT key, value FROM config WHERE key = ?');

        this.#getCompanies = this.#db.prepare('SELECT id, fake_name, real_name, info FROM companies');
        this.#getCompany = this.#db.prepare('SELECT id, fake_name, real_name, info FROM companies WHERE id = ?');
        this.#insertCompany = this.#db.prepare('INSERT INTO companies (fake_name, real_name, info) VALUES (?, ?, ?)');
        this.#removeCompany = this.#db.prepare('DELETE FROM companies WHERE id = ?');
        this.#updateCompany = this.#db.prepare('UPDATE companies SET fake_name = ?, real_name = ?, info = ? WHERE id = ?');
    }

    #initializeDatabase() {
        this.#db.exec(`
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT
            );
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fake_name TEXT NOT NULL UNIQUE,
                real_name TEXT NOT NULL,
                info TEXT
            );
        `)
    }

    /**
     * Safely executes a callback function and handles any errors.
     * @param {Function} callback - The function to execute.
     * @returns {{error?: DatabaseError, data?: any}} Returns the result of the callback or an error object.
     */
    #SafeExecution(callback) {
        try {
            return callback();
        } catch (err) {
            return { error: err };
        }
    }

    /**
     * Returns config value by key
     * @param {string} key key
     * @returns {{error?: DatabaseError, data?: string}} Data: config value
     */
    GetConfig(key) {
        return this.#SafeExecution(() => {
            const result = this.#getConfig.get(key);
            if (!result) {
                throw new DatabaseError(`Config variable ${key} does not exist`, ErrorCodes.CONFIG_NOT_FOUND);
            }
            return { data: result.value };
        })
    }

    /**
     * Sets key-value pairs in config table
     * @param {string} key key
     * @param {string} value value
     * @returns {{error?: DatabaseError, data?: {key: string, value: string}}} Data: {key: string, value: string}
     */
    SetConfig(key, value) {
        return this.#SafeExecution(() => {
            const result = this.#setConfig.run(key, value);
            return { data: { key: key, value: value } };
        })
    }

    /**
     * Returns all company data.
     * @returns {{error?: DatabaseError, data?: [{id: number, fake_name: string, real_name: string, info?: string}]}} Data: Companies
     */
    GetCompanies() {
        return this.#SafeExecution(() => {
            const result = this.#getCompanies.all();
            return { data: result };
        })
    }

    /**
     * Gets company by id.
     * @param {number} id Company id
     * @returns {{error?: DatabaseError, data?: {id: number, fake_name: string, real_name: string, info?: string}}} Data: Company
     */
    GetCompany(id) {
        return this.#SafeExecution(() => {
            const result = this.#getCompany.get(id);
            if (!result) {
                throw new DatabaseError(`Company with id ${id} does not exist`, ErrorCodes.COMPANY_NOT_FOUND);
            }
            return { data: result };
        })
    }

    /**
     * Inserts company to the companies table.
     * @param {string} fake_name fake_name of the company.
     * @param {string} real_name real_name of the company.
     * @param {string?} info extra information about company.
     * @returns {{error?: DatabaseError, data?: {id: number, fake_name: string, real_name: string, info?: string}}} Data: Inserted company
     */
    InsertCompany(fake_name, real_name, info = null) {
        return this.#SafeExecution(() => {
            try {
                const result = this.#insertCompany.run(fake_name, real_name, info);
                return { data: {
                    id: result.lastInsertRowid,
                    fake_name: fake_name,
                    real_name: real_name,
                    info: info
                } };
            } catch (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    throw new DatabaseError(`Company with fake_name ${fake_name} already exists`, ErrorCodes.SQLITE_CONSTRAINT_UNIQUE);
                }
                throw err;
            }
        })
    }

    /**
     * Removes specified company
     * @param {number} id Company id
     * @returns {{error?: DatabaseError, data?: number}} Data: Deleted company id
     */
    RemoveCompany(id) {
        return this.#SafeExecution(() => {
            const result = this.#removeCompany.run(id);
            if (result.changes === 0) {
                throw new DatabaseError(`Company with id ${id} does not exist`, ErrorCodes.COMPANY_NOT_FOUND)
            }
            return { data: id };
        })
    }

    /**
     * Updates given company by id
     * @param {number} id Company id
     * @param {string} fake_name New fake_name
     * @param {string} real_name New real_name
     * @param {string?} info New info
     * @returns {{error?: DatabaseError, data?: {id: number, fake_name: string, real_name: string, info?: string}}} Data: Updated company
     */
    UpdateCompany(id, fake_name, real_name, info = null) {
        return this.#SafeExecution(() => {
            const result = this.#updateCompany.run(fake_name, real_name, info, id);
            if (result.changes === 0) {
                throw new DatabaseError(`Company with id ${id} does not exist`, ErrorCodes.COMPANY_NOT_FOUND)
            }
            return { data: {
                id: id,
                fake_name: fake_name,
                real_name: real_name,
                info: info
            } };
        })
    }

    /**
     * Inserts multiple companies into the companies table.
     * @param {[{fake_name: string, real_name: string, info: string?}]} companies
     * @returns {{error?: DatabaseError, data?: [{id: number, fake_name: string, real_name: string, info?: string}]}} Data: Inserted companies
     */
    InsertCompanyBulk(companies) {
        return this.#SafeExecution(() => {
            const insertedCompanies = [];

            const transaction = this.#db.transaction(() => {
                for (const { fake_name, real_name, info } of companies) {
                    try {
                        const result = this.#insertCompany.run(fake_name, real_name, info ?? null);
                        insertedCompanies.push({
                            id: result.lastInsertRowid,
                            fake_name: fake_name,
                            real_name: real_name,
                            info: info
                        });
                    } catch (err) {
                        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                            throw new DatabaseError(`Company with fake_name ${fake_name} already exists`, ErrorCodes.SQLITE_CONSTRAINT_UNIQUE);
                        }
                        throw err;
                    }
                }
            })

            transaction(); // If transaction fails with SQLITE_CONSTRAINT_UNIQUE, it should be catched at SafeExecution level
            return { data: insertedCompanies };
        })
    }

    /**
     * Deletes multiple companies from the companies table.
     * @param {[number]} ids - Array of company IDs to delete.
     * @returns {{error?: DatabaseError, data?: [number]}} Data: Deleted company IDs
     */
    RemoveCompanyBulk(ids) {
        return this.#SafeExecution(() => {
            const transaction = this.#db.transaction(() => {
                for (const id of ids) {
                    const result = this.#removeCompany.run(id);
                    if (result.changes === 0) {
                        throw new DatabaseError(`Company with id ${id} does not exist`, ErrorCodes.COMPANY_NOT_FOUND);
                    }
                }
            });

            transaction(); // Any error including the one I throw, will be catched at SafeExecution level
            return { data: ids };
        });
    }

    /**
     * Updates multiple companies by their IDs.
     * @param {[{id: number, fake_name: string, real_name: string, info: string?}]} companies
     * @returns {{error?: DatabaseError, data?: [{id: number, fake_name: string, real_name: string, info?: string}]}} Data: Updated companies
     */
    UpdateCompanyBulk(companies) {
        return this.#SafeExecution(() => {
            const transaction = this.#db.transaction(() => {
                for (const { id, fake_name, real_name, info } of companies) {
                    const result = this.#updateCompany.run(fake_name, real_name, info ?? null, id);
                    if (result.changes === 0) {
                        throw new DatabaseError(`Company with id ${id} does not exist`, ErrorCodes.COMPANY_NOT_FOUND);
                    }
                }
            });

            transaction(); // Any error including the one I throw, will be catched at SafeExecution level
            return { data: companies };
        });
    }

    /**
     * Closes the database connection
     * @returns {{error?: DatabaseError, data?: boolean}} Data: is database closed
     */
    Dispose() {
        return this.#SafeExecution(() => {
            this.#db.close();
            return { data: true };
        })
    }
}


/**
 * Singleton DataManager instance to interact with database.
 * @type {DataManager}
 */
export const DataManagerInstance = new DataManager();