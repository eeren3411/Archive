import path from 'path';

/**
 * Port number
 * @type {number}
 */
export const PORT = 3411;

/**
 * Project root folder
 * @type {string}
 */
export const ROOT = import.meta.dirname;

/**
 * Session timeout, defaults to 5 minutes.
 * @type {number}
 */
export const SESSION_TIMEOUT = 5*60*1000; 

/**
 * Filename of the database
 * @type {string}
 */
export const DATABASE_FILENAME = "CompanyDatabase.db";

/**
 * If database file is corrupt, move the file into this folder with timestamp attached.
 * @type {string}
 */
export const DATABASE_ARCHIVE_FOLDER = path.join(ROOT, 'archive');