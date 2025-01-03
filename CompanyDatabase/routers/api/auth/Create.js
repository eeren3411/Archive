import { BodyFieldChecker } from '#middleware/FieldCheckerMW';
import { DataManagerInstance, DatabaseErrorCodes } from '#managers/DataManager';
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
    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.CONFIG_NOT_FOUND) return next(); // Continue if configs doesnt exists

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(); // Any other error should return an internal server error
    }

    if (result.data.value) {
        return res.status(StatusCodes.CONFLICT).json({
            error: "Database already exists"
        });
    }

    return next();
};

const router = express.Router();

/**
 * Initializes the database with the given salt and checksum.
 * @method POST
 * @route POST api/auth/create
 * @param {{salt: string, checksum: string}} req.body
 * @returns {{salt: string, checksum: string}}
 */
router.post('/create', BodyFieldChecker('salt', 'checksum'), CraeteRulesMW, CreateSessionMW, (req, res, next) => {
    const salt = req.body.salt;
    const checksum = req.body.checksum;

    const result = DataManagerInstance.CreateConfigs(salt, checksum);

    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.INPUT_NOT_VALID) return res.status(StatusCodes.BAD_REQUEST).json({
            error: result.error.message
        });

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return res.status(StatusCodes.CREATED).json(result.data);
});

export { router }