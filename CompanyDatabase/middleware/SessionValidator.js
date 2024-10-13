import { SessionManagerInstance } from '../managers/SessionManager';
import { StatusCodes } from 'http-status-codes';

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export function SessionValidator(req,res, next) {
    const SessionID = req.headers['sessionid'];
    const ClientIP = req.ip;
    const UserAgent = req.headers['user-agent'];

    const result = SessionManagerInstance.Validate(SessionID, ClientIP, UserAgent);

    if (!result) {
        res.status(StatusCodes.UNAUTHORIZED).send({error: "Invalid Session"});
        return;
    }

    next();
}