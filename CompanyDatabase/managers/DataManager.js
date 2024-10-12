import Database from 'better-sqlite3';

import path from 'path';
import fs from 'fs';

import { ROOT, DATABASE_FILENAME, DATABASE_ARCHIVE_FOLDER } from "#config";

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
     * 
     * If companies table have keys but either checksum or salt is missing, database is corrupted. 
     * 
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
                fake_name TEXT NOT NULL,
                real_name TEXT NOT NULL,
                info TEXT
            );
        `)
    }

    /**
     * Returns value from config table
     * @param {string} key key
     * @returns {string} Value
     */
    GetConfig(key) {
        return this.#getConfig.get(key)?.value;
    }

    /**
     * Sets key-value pairs in config table
     * @param {string} key key
     * @param {string} value value
     * @returns {boolean} if operation is successful.
     */
    SetConfig(key, value) {
        return this.#setConfig.run(key, value).changes > 0;
    }

    /**
     * Returns all company data.
     * @returns {[{id: number, fake_name: string, real_name: string, info: string?}]}
     */
    GetCompanies() {
        return this.#getCompanies.all();
    }
    /**
     * Inserts company to the companies table.
     * @param {string} fake_name fake_name of the company.
     * @param {string} real_name real_name of the company.
     * @param {string?} info extra information about company.
     * @returns {boolean} if operation is successful.
     */
    InsertCompany(fake_name, real_name, info) {
        return this.#insertCompany.run(fake_name, real_name, info).changes > 0;
    }

    /**
     * Removes specified company
     * @param {number} id Company id
     * @returns {boolean} if operation is successful.
     */
    RemoveCompany(id) {
        return this.#removeCompany.run(id).changes > 0;
    }

    /**
     * Updates given company by id
     * @param {number} id Company id
     * @param {string} fake_name New fake_name
     * @param {string} real_name New real_name
     * @param {string?} info New info
     * @returns {boolean} if operation is successful.
     */
    UpdateCompany(id, fake_name, real_name, info) {
        return this.#updateCompany.run(fake_name, real_name, info, id).changes > 0;
    }

    /**
     * Inserts multiple companies into the companies table.
     * @param {[{fake_name: string, real_name: string, info: string?}]} companies
     * @returns {boolean} if the operation is successful.
     */
    InsertCompanyBulk(companies) {
        const transaction = this.#db.transaction((companies) => {
            for (const { fake_name, real_name, info } of companies) {
                this.#insertCompany.run(fake_name, real_name, info);
            }
        });

        try {
            transaction(companies);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Deletes multiple companies from the companies table.
     * @param {[number]} ids - Array of company IDs to delete.
     * @returns {boolean} if the operation is successful.
     */
    RemoveCompanyBulk(ids) {
        const transaction = this.#db.transaction((ids) => {
            for (const id of ids) {
                this.#removeCompany.run(id);
            }
        });

        try {
            transaction(ids);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Updates multiple companies by their IDs.
     * @param {[{id: number, fake_name: string, real_name: string, info: string?}]} companies
     * @returns {boolean} if the operation is successful.
     */
    UpdateCompanyBulk(companies) {
        const transaction = this.#db.transaction((companies) => {
            for (const { id, fake_name, real_name, info } of companies) {
                this.#updateCompany.run(fake_name, real_name, info, id);
            }
        });

        try {
            transaction(companies);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Closes the database connection
     */
    Dispose() {
        this.#db.close();
    }
}

/**
 * Singleton DataManager instance to interact with database.
 * @type {DataManager}
 */
export const DataManagerInstance = new DataManager();