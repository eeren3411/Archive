import { SessionManagerInstance } from '#managers/SessionManager';
import { StatusCodes } from 'http-status-codes';
import { SESSION_TIMEOUT } from '#config';

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
export function SessionValidatorMW(req, res, next) {
    const result = SessionManagerInstance.Validate(req);

    if (!result) return res.status(StatusCodes.UNAUTHORIZED).send({error: "Invalid Session"});

    res.cookie('sessionid', req.cookies['sessionid'], {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: SESSION_TIMEOUT
    });
    next();
}

export function CreateSessionMW(req, res, next) {
    res.cookie('sessionid', SessionManagerInstance.CreateSession(req), {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: SESSION_TIMEOUT
    });
    next();
}