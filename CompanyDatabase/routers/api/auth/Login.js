import { SessionManagerInstance } from "#managers/SessionManager";
import { DataManagerInstance } from "#managers/DataManager";
import { CreateSessionMW } from "#middleware/SessionMW";
import { StatusCodes } from "http-status-codes";
import express from "express";

/**
 * Checks if the checksum exists and is valid.
 * Returns 422 if the checksum is missing, 404 if the database does not exist, and 401 if the checksum is invalid.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function LoginRulesMW(req, res, next) {
    if (!req.body.checksum) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            error: "Missing parameters (Checksum)"
        })
    }

    const checksum = DataManagerInstance.GetConfig('checksum');
    if (!checksum) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: "Database does not exist"
        })
    }

    if (checksum !== req.body.checksum) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            error: "Invalid checksum"
        })
    }

    next();
}

const router = express.Router();
router.post('/login', LoginRulesMW, CreateSessionMW, (req, res, next) => {
    return res.status(StatusCodes.OK).json({
        checksum: req.body.checksum
    });
})

export { router }