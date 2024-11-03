import Database from 'better-sqlite3';

import path from 'path';
import fs from 'fs';

import { ROOT, DATABASE_FILENAME, DATABASE_ARCHIVE_FOLDER } from "#config";

/**
 * Custom error codes used in DataManaer
 * @enum {number}
 */
export const DatabaseErrorCodes = {
    /**
     * Key not found in config table
     */
    CONFIG_NOT_FOUND: 0,
    /**
     * Company not found with given ID
     */
    COMPANY_NOT_FOUND: 1,
    /**
     * Input is broken
     */
    INPUT_NOT_VALID: 2,
    /**
     * There is already a row with the same unique field
     */
    SQLITE_CONSTRAINT_UNIQUE: 3,
    /**
     * Data length does not match current row count.
     * Fired at RotateDatabase only
     */
    DATA_LENGTH_MISMATCH: 4
}

class DatabaseError extends Error {
    /**
     * Constructor for a DatabaseError
     * @param {string} message - A human-readable error message
     * @param {string} code - An error code defined in DatabaseErrorCodes Object
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

    /**
     * Is Database file created or read
     * True if created, False if already exists and just read
     * @type {boolean}
     */
    #isDatabaseCreated;
    constructor() {
        this.#dbFilePath = path.join(ROOT, DATABASE_FILENAME);

        // Check if database file exists
        this.#isDatabaseCreated = !fs.existsSync(this.#dbFilePath);

        this.#db = new Database(this.#dbFilePath);

        // if database is just created, skip validation.
        // if validation fails, move old db file to archive directory.
        if (!this.#isDatabaseCreated && !this.#validateDatabase()) {
            console.error("Database corrupted. Moving old database to archive folder.");
            this.#archiveDatabase();
            
            // Remove old database file
            this.#db.close();
            fs.rmSync(this.#dbFilePath);

            // Create new database
            this.#db = new Database(this.#dbFilePath);
            this.#isDatabaseCreated = true;
        }

        if (this.#isDatabaseCreated) {
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
     * @returns {boolean} Returns true if the database is intact, false if corrupted.
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
     * Archives database
     * @returns {string} Name of the archived database file
     */
    #archiveDatabase() {
        // Make sure archive folder exists
        fs.mkdirSync(DATABASE_ARCHIVE_FOLDER, {recursive: true});

        // Copy database file
        const archiveName = `${Date.now()}-${DATABASE_FILENAME}`;
        const archivePath = path.join(DATABASE_ARCHIVE_FOLDER, archiveName);
        fs.copyFileSync(this.#dbFilePath, archivePath);

        console.log(`Archived database at: ${archivePath}`);

        return archiveName;
    }

    /**
     * Initializes database with 2 tables
     * - config - key primary text, value text 
     * - companies - id primary integer, fake_name unique text, real_name text, info nullable text
     */
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
     * Inserts data to config table
     * @type {Database.Statement<{key: string, value: string}>}
     */
    #setConfig;

    /**
     * Gets config variable by key from config table
     * @type {Database.Statement<{key: string}, {key: string, value: string}>}
     */
    #getConfig

    /**
     * Gets all the companies.
     * @type {Database.Statement<[],{id: number, fake_name: string, real_name: string, info?: string}>}
     */
    #getCompanies

    /**
     * Get company by id
     * @type {Database.Statement<{id: number}, {id: number, fake_name: string, real_name: string, info?: string}>}
     */
    #getCompany
    /**
     * Inserts new company to company table
     * @type {Database.Statement<{fake_name: string, real_name: string, info?: string}>}
     */
    #insertCompany

    /**
     * Deletes company from company table
     * @type {Database.Statement<{id: number}>}
     */
    #removeCompany

    /**
     * Updates company at company table
     * @type {Database.Statement<{id: number, fake_name: string, real_name: string, info?: string}>}
     */
    #updateCompany

    /**
     * Get company count
     * @type {Database.Statement<[], {count: number}>}
     */
    #getCompanyCount

    /**
     * This function prepares database statements for quick execution in the future.
     */
    #prepareMethods() {
        this.#setConfig = this.#db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (@key, @value)');
        this.#getConfig = this.#db.prepare('SELECT key, value FROM config WHERE key = @key');

        this.#getCompanies = this.#db.prepare('SELECT id, fake_name, real_name, info FROM companies');
        this.#getCompany = this.#db.prepare('SELECT id, fake_name, real_name, info FROM companies WHERE id = @id');

        this.#insertCompany = this.#db.prepare('INSERT INTO companies (fake_name, real_name, info) VALUES (@fake_name, @real_name, @info)');

        this.#removeCompany = this.#db.prepare('DELETE FROM companies WHERE id = @id');

        this.#updateCompany = this.#db.prepare('UPDATE companies SET fake_name = @fake_name, real_name = @real_name, info = @info WHERE id = @id');

        this.#getCompanyCount = this.#db.prepare('SELECT COUNT(*) as count FROM companies');
    }

    /**
     * Safely executes a callback function and handles any errors.
     * @param {Function} callback - The function to execute.
     * @returns {{error?: Error, data?: any}} Returns the result of the callback or an error object.
     */
    #SafeExecution(callback) {
        try {
            return { data: callback() };
        } catch (err) {
            if (!(err instanceof DatabaseError)) console.error(err);
            return { error: err };
        }
    }

    /**
     * UNSAFE: GetConfig
     * @param {string} key 
     * @returns {{key: string, value: string}}
     * @throws {DatabaseError} CONFIG_NOT_FOUND
     */
    #GetConfig(key) {
        const result = this.#getConfig.get({
            key: key
        });
        if (!result) throw new DatabaseError(`Config variable ${key} does not exist`, DatabaseErrorCodes.CONFIG_NOT_FOUND);
        return {
            key: key,
            value: result.value
        };
    }

    /**
     * Returns config value by key
     * @param {string} key key
     * @returns {{error?: Error, data?: {key: string, value: string}}} Data: config value
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} CONFIG_NOT_FOUND
     */
    GetConfig(key) {
        return this.#SafeExecution(() => {
            if (typeof key !== "string" || key.trim() === "") throw new DatabaseError("Invalid type for key at GetConfig", DatabaseErrorCodes.INPUT_NOT_VALID);
    
            return this.#GetConfig(key);
        })
    }

    /**
     * UNSAFE: SetConfig
     * @param {string} key 
     * @param {string} value 
     * @returns {{key: string, value: string}}
     */
    #SetConfig(key, value) {
        this.#setConfig.run({
            key: key,
            value: value
        });

        return {
            key: key,
            value: value
        };
    }

    /**
     * Sets key-value pairs in config table
     * @param {string} key key
     * @param {string} value value
     * @returns {{error?: Error, data?: {key: string, value: string}}} Data: {key: string, value: string}
     * @throws {DatabaseError} INPUT_NOT_VALID
     */
    SetConfig(key, value) {
        return this.#SafeExecution(() => {
            if (typeof key !== "string" || key.trim() === "") throw new DatabaseError("Invalid type for key at SetConfig", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (typeof value !== "string" || value.trim() === "") throw new DatabaseError("Invalid type for value at SetConfig", DatabaseErrorCodes.INPUT_NOT_VALID);
    
            return this.#SetConfig(key, value);
        })
    }

    /**
     * UNSAFE: CreateConfigs
     * @param {string} salt 
     * @param {string} checksum 
     * @returns {{salt: string, checksum: string}}
     */
    #CreateConfigs(salt, checksum) {
        const transaction = this.#db.transaction(() => {
            this.#SetConfig('salt', salt);
            this.#SetConfig('checksum', checksum);
        });

        transaction();

        return {
            salt: salt,
            checksum: checksum
        };
    }

    /**
     * Initializes the database with the given salt and checksum.
     * @param {string} salt 
     * @param {string} checksum 
     * @returns {{error?: Error, data?: {salt: string, checksum: string}}}
     * @throws {DatabaseError} INPUT_NOT_VALID
     */
    CreateConfigs(salt, checksum) {
        return this.#SafeExecution(() => {
            if (typeof salt !== "string" || salt.trim() === "") throw new DatabaseError("Invalid type for salt at CreateConfigs", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (typeof checksum !== "string" || checksum.trim() === "") throw new DatabaseError("Invalid type for checksum at CreateConfigs", DatabaseErrorCodes.INPUT_NOT_VALID);

            return this.#CreateConfigs(salt, checksum);
        })
    }

    /**
     * #UNSAFE: GetCompanyCount
     * @returns {{count: number}}
     */
    #GetCompanyCount() {
        return this.#getCompanyCount.get();
    }

    /**
     * Returns the total count of companies in the database.
     * @returns {{error?: Error, data?: {count: number}}} Data: count of companies
     */
    GetComapnyCount() {
        return this.#SafeExecution(() => {
            return this.#GetCompanyCount();
        })
    }

    /**
     * UNSAFE: GetCompanies
     * @returns {[{id: number, fake_name: string, real_name: string, info?: string}]}
     */
    #GetCompanies() {
        return this.#getCompanies.all();
    }

    /**
     * Returns all company data.
     * @returns {{error?: Error, data?: [{id: number, fake_name: string, real_name: string, info?: string}]}} Data: Companies
     */
    GetCompanies() {
        return this.#SafeExecution(() => {
            return this.#GetCompanies();
        })
    }

    /**
     * UNSAFE: GetCompany
     * @param {number} id 
     * @returns {{id: number, fake_name: string, real_name: string, info?: string}}
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     */
    #GetCompany(id) {
        const result = this.#getCompany.get({
            id: id
        });
        if (!result) throw new DatabaseError(`Company with id ${id} does not exist`, DatabaseErrorCodes.COMPANY_NOT_FOUND);
        return result;
    }

    /**
     * Gets company by id.
     * @param {number} id Company id
     * @returns {{error?: Error, data?: {id: number, fake_name: string, real_name: string, info?: string}}} Data: Company
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     */
    GetCompany(id) {
        return this.#SafeExecution(() => {
            if (typeof id !== "number") throw new DatabaseError("Invalid type for id at GetCompany", DatabaseErrorCodes.INPUT_NOT_VALID);
    
            return this.#GetCompany(id);
        })
    }

    /**
     * UNSAFE: InsertCompany
     * @param {string} fake_name 
     * @param {string} real_name 
     * @param {string?} info 
     * @returns {{id: number, fake_name: string, real_name: string, info?: string}}
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    #InsertCompany(fake_name, real_name, info = null) {
        try {
            const result = this.#insertCompany.run({
                fake_name: fake_name,
                real_name: real_name,
                info: info
            });
            return {
                id: result.lastInsertRowid,
                fake_name: fake_name,
                real_name: real_name,
                info: info
            };
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new DatabaseError(`Company with fake_name ${fake_name} already exists`, DatabaseErrorCodes.SQLITE_CONSTRAINT_UNIQUE);
            throw err;
        }
    }
    /**
     * Inserts company to the companies table.
     * @param {string} fake_name fake_name of the company.
     * @param {string} real_name real_name of the company.
     * @param {string?} info extra information about company.
     * @returns {{error?: Error, data?: {id: number, fake_name: string, real_name: string, info?: string}}} Data: Inserted company
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    InsertCompany(fake_name, real_name, info = null) {
        return this.#SafeExecution(() => {
            if (typeof fake_name !== "string" || fake_name.trim() === "") throw new DatabaseError("Invalid type for fake_name at InsertCompany", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (typeof real_name !== "string" || real_name.trim() === "") throw new DatabaseError("Invalid type for real_name at InsertCompany", DatabaseErrorCodes.INPUT_NOT_VALID);
    
            return this.#InsertCompany(fake_name, real_name, info);
        })
    }

    /**
     * UNSAFE: RemoveCompany
     * @param {number} id 
     * @returns {{id: number}}
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     */
    #RemoveCompany(id) {
        const result = this.#removeCompany.run({
            id: id
        });
        if (result.changes === 0) throw new DatabaseError(`Company with id ${id} does not exist`, DatabaseErrorCodes.COMPANY_NOT_FOUND);
        return {
            id: id
        };
    }

    /**
     * Removes specified company
     * @param {number} id Company id
     * @returns {{error?: Error, data?: {id: number}}} Data: Deleted company id
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     */
    RemoveCompany(id) {
        return this.#SafeExecution(() => {
            if (typeof id !== "number") throw new DatabaseError("Invalid type for id at RemoveCompany", DatabaseErrorCodes.INPUT_NOT_VALID);
            
            return this.#RemoveCompany(id);
        })
    }

    /**
     * UNSAFE: UpdateCompany
     * @param {number} id 
     * @param {string} fake_name 
     * @param {string} real_name 
     * @param {string?} info 
     * @returns  {{id: number, fake_name: string, real_name: string, info?: string}}
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    #UpdateCompany(id, fake_name, real_name, info = null) {
        try {
            const result = this.#updateCompany.run({
                id: id,
                fake_name: fake_name,
                real_name: real_name,
                info: info
            });
            if (result.changes === 0) throw new DatabaseError(`Company with id ${id} does not exist`, DatabaseErrorCodes.COMPANY_NOT_FOUND);
            return {
                id: id,
                fake_name: fake_name,
                real_name: real_name,
                info: info
            };
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new DatabaseError(`Company with fake_name ${fake_name} already exists`, DatabaseErrorCodes.SQLITE_CONSTRAINT_UNIQUE);
            throw err;
        }
    }

    /**
     * Updates given company by id
     * @param {number} id Company id
     * @param {string} fake_name New fake_name
     * @param {string} real_name New real_name
     * @param {string?} info New info
     * @returns {{error?: Error, data?: {id: number, fake_name: string, real_name: string, info?: string}}} Data: Updated company
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    UpdateCompany(id, fake_name, real_name, info = null) {
        return this.#SafeExecution(() => {
            if (typeof id !== "number") throw new DatabaseError("Invalid type for id at UpdateCompany", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (typeof fake_name !== "string" || fake_name.trim() === "") throw new DatabaseError("Invalid type for fake_name at UpdateCompany", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (typeof real_name !== "string" || real_name.trim() === "") throw new DatabaseError("Invalid type for real_name at UpdateCompany", DatabaseErrorCodes.INPUT_NOT_VALID);
            
            return this.#UpdateCompany(id, fake_name, real_name, info);
        })
    }

    /**
     * UNSAFE: InsertCompanyBulk
     * @param {[{fake_name: string, real_name: string, info?: string}]} companies 
     * @returns {[{id: number, fake_name: string, real_name: string, info?: string}]}
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    #InsertCompanyBulk(companies) {
        const insertedCompanies = [];

        const transaction = this.#db.transaction(() => {
            companies.forEach(company => {
                const result = this.#InsertCompany(company.fake_name, company.real_name, company.info);
                insertedCompanies.push(result);
            })
        })
        
        transaction();
        return insertedCompanies;
    }

    /**
     * Inserts multiple companies into the companies table.
     * @param {[{fake_name: string, real_name: string, info?: string}]} companies
     * @returns {{error?: Error, data?: [{id: number, fake_name: string, real_name: string, info?: string}]}} Data: Inserted companies
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    InsertCompanyBulk(companies) {
        return this.#SafeExecution(() => {
            if (!Array.isArray(companies)) throw new DatabaseError("companies must be an array at InsertCompanyBulk", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (companies.some(company => 
                company === null || typeof company !== "object" ||
                typeof company.fake_name !== "string" || company.fake_name.trim() !== "" || 
                typeof company.real_name !== "string" || company.real_name.trim() !== ""
            )) throw new DatabaseError("Invalid type for company at InsertCompanyBulk", DatabaseErrorCodes.INPUT_NOT_VALID);

            return this.#InsertCompanyBulk(companies);
        })
    }

    /**
     * UNSAFE: RemoveCompanyBulk
     * @param {[number]} ids 
     * @returns {{ids: [number]}}
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     */
    #RemoveCompanyBulk(ids) {
        const transaction = this.#db.transaction(() => {
            ids.forEach(id => {
                this.#RemoveCompany(id);
            })
        });
        
        transaction();
        return {
            ids: ids
        };
    }

    /**
     * Deletes multiple companies from the companies table.
     * @param {[number]} ids - Array of company IDs to delete.
     * @returns {{error?: Error, data?: {ids: [number]}}}} Data: Deleted company IDs
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     */
    RemoveCompanyBulk(ids) {
        return this.#SafeExecution(() => {
            if (!Array.isArray(ids)) throw new DatabaseError("ids must be an array at RemoveCompanyBulk", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (ids.some(id => typeof id !== "number")) throw new DatabaseError("Invalid type for id at RemoveCompanyBulk", DatabaseErrorCodes.INPUT_NOT_VALID);

            return this.#RemoveCompanyBulk(ids);
        });
    }

    /**
     * UNSAFE: UpdateCompanyBulk
     * @param {[{id: number, fake_name: string, real_name: string, info?: string}]} companies 
     * @returns {[{id: number, fake_name: string, real_name: string, info?: string}]}
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    #UpdateCompanyBulk(companies) {
        const transaction = this.#db.transaction(() => {
            companies.forEach(company => {
                this.#UpdateCompany(company.id, company.fake_name, company.real_name, company.info);
            })
        });
        
        transaction();
        return companies;
    }
    /**
     * Updates multiple companies by their IDs.
     * @param {[{id: number, fake_name: string, real_name: string, info?: string}]} companies
     * @returns {{error?: Error, data?: [{id: number, fake_name: string, real_name: string, info?: string}]}} Data: Updated companies
     * @throws {DatabaseError} INPUT_NOT_VALID
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    UpdateCompanyBulk(companies) {
        return this.#SafeExecution(() => {
            if (!Array.isArray(companies)) throw new DatabaseError("companies must be an array at UpdateCompanyBulk", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (companies.some(company => 
                company === null || typeof company !== "object" ||
                typeof company.id !== "number" || 
                typeof company.fake_name !== "string" || company.fake_name.trim() !== "" ||
                typeof company.real_name !== "string" || company.real_name.trim() !== ""
            )) throw new DatabaseError("Invalid type for company at UpdateCompanyBulk", DatabaseErrorCodes.INPUT_NOT_VALID);

            return this.#UpdateCompanyBulk(companies);
        });
    }

    /**
     * UNSAFE: RotateDatabase
     * @param {string} salt 
     * @param {string} checksum 
     * @param {[{id: number, fake_name: string, real_name: string, info?: string}]} data 
     * @param {boolean} backup 
     * @returns {{salt: string, checksum: string, updated: number, timestamp?: number}}
     * @throws {DatabaseError} DATA_LENGTH_MISMATCH
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     */
    #RotateDatabase(salt, checksum, data, backup = false) {
        const companyCount = this.#GetCompanyCount().count;
        if (companyCount !== data.length) throw new DatabaseError("Invalid company count at RotateDatabase", DatabaseErrorCodes.DATA_LENGTH_MISMATCH);

        const backupFile = backup && this.#archiveDatabase();

        const transaction = this.#db.transaction(() => {
            this.#UpdateCompanyBulk(data);

            this.#SetConfig('salt', salt);
            this.#SetConfig('checksum', checksum);
        });
        
        transaction();

        return {
            salt: salt,
            checksum: checksum,
            backup: backupFile,
            updated: companyCount
        };
    }

    /**
     * Rotate the database with new salt and checksum.
     * This updates all existing companies in the database.
     * @param {string} salt New salt
     * @param {string} checksum New checksum
     * @param {[{id: number, fake_name: string, real_name: string, info?: string}]} data Array of companies to insert
     * @param {boolean} backup Whether to create a backup of the database
     * @returns {{error?: Error, data?: {salt: string, checksum: string, updated: number, timestamp?: number}}}
     * @throws {DatabaseError} DATA_LENGTH_MISMATCH
     * @throws {DatabaseError} COMPANY_NOT_FOUND
     * @throws {DatabaseError} SQLITE_CONSTRAINT_UNIQUE
     * @throws {DatabaseError} INPUT_NOT_VALID
     */
    RotateDatabase(salt, checksum, data, backup = false) {
        return this.#SafeExecution(() => {
            if (typeof salt !== "string" || salt.trim() === "") throw new DatabaseError("Invalid type for salt at RotateDatabase", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (typeof checksum !== "string" || checksum.trim() === "") throw new DatabaseError("Invalid type for checksum at RotateDatabase", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (!Array.isArray(data)) throw new DatabaseError("data must be an array at RotateDatabase", DatabaseErrorCodes.INPUT_NOT_VALID);
            if (data.some(company => 
                company === null || typeof company !== "object" ||
                typeof company.id !== "number" || typeof company.fake_name !== "string" || typeof company.real_name !== "string"
            )) throw new DatabaseError("Invalid type for company at RotateDatabase", DatabaseErrorCodes.INPUT_NOT_VALID);

            return this.#RotateDatabase(salt, checksum, data, backup);
        });
    }

    /**
     * Closes the database connection
     * @returns {{error?: Error, data?: boolean}} Data: is database closed
     */
    Dispose() {
        return this.#SafeExecution(() => {
            if (this.#db.open) this.#db.close();
            return true;
        })
    }
}


/**
 * Singleton DataManager instance to interact with database.
 * @type {DataManager}
 */
export const DataManagerInstance = new DataManager();