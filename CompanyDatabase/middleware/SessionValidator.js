import { SessionManagerInstance } from '../managers/SessionManager';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
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