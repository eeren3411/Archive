import { BodyFieldChecker } from "#middleware/FieldCheckerMW";
import { DataManagerInstance, DatabaseErrorCodes } from "#managers/DataManager";
import { CreateSessionMW } from "#middleware/SessionMW";
import { StatusCodes } from "http-status-codes";
import express from "express";

/**
 * Checks if the checksum is valid.
 * Returns 404 if the database does not exist, and 401 if the checksum is invalid.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function LoginRulesMW(req, res, next) {
    const result = DataManagerInstance.GetConfig('checksum');
    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.CONFIG_NOT_FOUND) return res.status(StatusCodes.NOT_FOUND).json({
            error: "Database does not exist"
        })

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    if (!result.data.value) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: "Database does not exist"
        })
    }

    if (result.data.value !== req.body.checksum) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            error: "Invalid checksum"
        })
    }

    next();
}

const router = express.Router();

/**
 * Checks user given checksum and initializes a session
 * @method POST
 * @route POST api/auth/login
 * @param {{checksum: string}} req.body
 * @returns {{checksum: string}}
 */
router.post('/login', BodyFieldChecker('checksum'), LoginRulesMW, CreateSessionMW, (req, res, next) => {
    return res.status(StatusCodes.OK).json({
        checksum: req.body.checksum
    });
})

export { router }