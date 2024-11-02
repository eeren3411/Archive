import { BodyFieldChecker } from '#middleware/FieldCheckerMW';
import { DataManagerInstance } from '#managers/DataManager';
import { CreateSessionMW } from '#middleware/SessionMW';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

/**
 * A middleware that checks if the database already exists.
 * If it does, it returns a 409 conflict.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function CraeteRulesMW(req, res, next) {
    const result = DataManagerInstance.GetConfig('salt');
    if (result.error) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();

    if (result.data) {
        return res.status(StatusCodes.CONFLICT).json({
            error: "Database already exists"
        });
    }

    return next();
};


const router = express.Router();
router.post('/create', BodyFieldChecker('salt', 'checksum'), CraeteRulesMW, CreateSessionMW, (req, res, next) => {
    const salt = req.body.salt.toString();
    const checksum = req.body.checksum.toString();

    const saltResult = DataManagerInstance.SetConfig('salt', salt);
    const checksumResult = DataManagerInstance.SetConfig('checksum', checksum);
    if (saltResult.error || checksumResult.error) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();

    return res.status(StatusCodes.CREATED).json({
        salt: salt,
        checksum: checksum
    });
});

export { router }