import { BodyFieldChecker } from '#middleware/FieldCheckerMW';
import { DataManagerInstance } from '#managers/DataManager';
import { CreateSessionMW } from '#middleware/SessionMW';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

/**
 * Checks if the checksum and salt exist and if the database does not exist.
 * Returns 422 if the checksum or salt is missing, and 409 if the database already exists.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function CraeteRulesMW(req, res, next) {
    if (DataManagerInstance.GetConfig('salt')) {
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
    DataManagerInstance.SetConfig('salt', salt);
    DataManagerInstance.SetConfig('checksum', checksum);

    return res.status(StatusCodes.CREATED).json({
        salt: salt,
        checksum: checksum
    });
});

export { router }