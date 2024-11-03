import { BodyArrayFieldChecker, HeaderFieldChecker } from '#middleware/FieldCheckerMW';
import { DataManagerInstance, DatabaseErrorCodes } from '#managers/DataManager';
import { SessionValidatorMW } from '#middleware/SessionMW';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

const router = express.Router();

/**
 * Rotates the database with new salt and checksum.
 * This updates all existing companies in the database.
 * @method POST
 * @route POST api/companies/rotate
 * 
 * @param {sessionid: string} req.cookies
 * @param {[{id: number, fake_name: string, real_name: string}]} req.body
 * @param {backup?: boolean} req.query
 * @param {x-salt: string, x-checksum: string} req.headers
 * 
 * @returns {StatusCodes.OK | StatusCodes.NOT_FOUND | StatusCodes.BAD_REQUEST | StatusCodes.CONFLICT | StatusCodes.INTERNAL_SERVER_ERROR}
 * @returns {[{id: number, fake_name: string, real_name: string, info: string}]}
 */
router.post('/rotate', SessionValidatorMW, BodyArrayFieldChecker('id', 'fake_name', 'real_name'), HeaderFieldChecker('x-salt', 'x-checksum'), (req, res, next) => {
    const backup = req.query?.backup?.toLocaleLowerCase() === 'true' || parseInt(req.query?.backup) > 0;

    const result = DataManagerInstance.RotateDatabase(req.headers['x-salt'], req.headers['x-checksum'], req.body, backup);

    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.INPUT_NOT_VALID) return res.status(StatusCodes.BAD_REQUEST).json({
            error: result.error.message
        })

        if (result.error.code === DatabaseErrorCodes.SQLITE_CONSTRAINT_UNIQUE) return res.status(StatusCodes.CONFLICT).json({
            error: result.error.message
        })

        if (result.error.code === DatabaseErrorCodes.COMPANY_NOT_FOUND) return res.status(StatusCodes.NOT_FOUND).json({
            error: result.error.message
        })

        if (result.error.code === DatabaseErrorCodes.DATA_LENGTH_MISMATCH) return res.status(StatusCodes.CONFLICT).json({
            error: result.error.message
        })

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return res.status(StatusCodes.OK).json(result.data);
});

export { router }