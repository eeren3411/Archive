import { v4 as uuidv4 } from 'uuid';

import { SESSION_TIMEOUT } from '#config';

class Session {
    /**
     * 
     * @param {string?} IP 
     * @param {string?} UserAgent 
     */
    constructor(IP, UserAgent) {
        /**
         * @type {string}
         */
        this.SessionID = uuidv4();
        /**
         * @type {string?}
         */
        this.IP = IP;
        /**
         * @type {string?}
         */
        this.UserAgent = UserAgent;
        /**
         * Timeout id
         * @type {number?}
         */
        this.DeleteTimeout = null;
    }
}

class SessionManager {
    /**
     * @type {Map<string, Session>}
     */
    #ActiveSessions;
    constructor() {
        this.#ActiveSessions = new Map();
    }

    /**
     * Deletes a session.
     * @param {string} SessionID 
     * @returns {boolean} If session is deleted or not.
     */
    DeleteSession (SessionID) {
        return this.#ActiveSessions.delete(SessionID);
    }

    /**
     * Creates new session and returns Session ID.
     * @param {import('express').Request} req
     * @returns {string} Session ID
     */
    CreateSession(req) {
        const session = new Session(req.ip, req.headers['user-agent']);
        session.DeleteTimeout = setTimeout(() => {
            this.DeleteSession(session.SessionID);
        }, SESSION_TIMEOUT);

        this.#ActiveSessions.set(session.SessionID, session);

        return session.SessionID;
    }

    /**
     * Returns if session is valid or not.
     * Resets timeout.
     * @param {string} SessionID 
     * @param {import('express').Request} req
     * @returns {boolean} Is session valid
     */
    Validate(SessionID, req) {
        const session = this.#ActiveSessions.get(SessionID);

        if (!session) return false;
        if (session.IP !== req.ip) return false;
        if (session.UserAgent !== req.headers['user-agent']) return false;

        clearTimeout(session.DeleteTimeout);
        session.DeleteTimeout = setTimeout(() => {
            this.DeleteSession(session.SessionID);
        }, SESSION_TIMEOUT);

        return true;
    }
}

/**
 * Singleton SessionManager instance.
 * @type {SessionManager}
 */
export const SessionManagerInstance = new SessionManager();