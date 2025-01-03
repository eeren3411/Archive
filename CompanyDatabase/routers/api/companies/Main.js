import { BodyFieldChecker, QueryFieldChecker } from '#middleware/FieldCheckerMW';
import { DataManagerInstance, DatabaseErrorCodes } from '#managers/DataManager';
import { SessionValidatorMW } from '#middleware/SessionMW';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

const router = express.Router();
/**
 * Gets a company by id
 * @method GET
 * @route GET api/companies
 * 
 * @param {sessionid: string} req.cookies
 * @param {id: number} req.query
 * 
 * @returns {StatusCodes.OK | StatusCodes.NOT_FOUND | StatusCodes.BAD_REQUEST | StatusCodes.INTERNAL_SERVER_ERROR}
 * @returns {{id: number, fake_name: string, real_name: string, info: string}} Company information
 */
router.get('/', SessionValidatorMW, QueryFieldChecker('id'), (req, res, next) => {
    const result = DataManagerInstance.GetCompany(parseInt(req.query?.id));

    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.COMPANY_NOT_FOUND) return res.status(StatusCodes.NOT_FOUND).json({
            error: result.error.message
        });

        if (result.error.code === DatabaseErrorCodes.INPUT_NOT_VALID) return res.status(StatusCodes.BAD_REQUEST).json({
            error: result.error.message
        });

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return res.status(StatusCodes.OK).json(result.data);
})

/**
 * Creates a new company
 * @method POST
 * @route POST api/companies
 * 
 * @param {sessionid: string} req.cookies
 * @param {fake_name: string, real_name: string, info?: string} req.body
 * 
 * @returns {StatusCodes.CREATED | StatusCodes.BAD_REQUEST | StatusCodes.CONFLICT | StatusCodes.INTERNAL_SERVER_ERROR}
 * @returns {{id: number, fake_name: string, real_name: string, info: string}} Company information
 */
router.post('/', SessionValidatorMW, BodyFieldChecker('fake_name', 'real_name'), (req, res, next) => {
    const result = DataManagerInstance.InsertCompany(req.body.fake_name, req.body.real_name, req.body.info);

    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.INPUT_NOT_VALID) return res.status(StatusCodes.BAD_REQUEST).json({
            error: result.error.message
        });

        if (result.error.code === DatabaseErrorCodes.SQLITE_CONSTRAINT_UNIQUE) return res.status(StatusCodes.CONFLICT).json({
            error: result.error.message
        });

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return res.status(StatusCodes.CREATED).json(result.data);
});

/**
 * Removes a company by id
 * @method DELETE
 * @route DELETE api/companies
 * 
 * @param {sessionid: string} req.cookies
 * @param {id: number} req.query
 * 
 * @returns {StatusCodes.NO_CONTENT | StatusCodes.NOT_FOUND | StatusCodes.BAD_REQUEST | StatusCodes.INTERNAL_SERVER_ERROR}
 */
router.delete('/', SessionValidatorMW, QueryFieldChecker('id'), (req, res, next) => {
    const result = DataManagerInstance.RemoveCompany(parseInt(req.query?.id));

    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.INPUT_NOT_VALID) return res.status(StatusCodes.BAD_REQUEST).json({
            error: result.error.message
        })

        if (result.error.code === DatabaseErrorCodes.COMPANY_NOT_FOUND) return res.status(StatusCodes.NOT_FOUND).json({
            error: result.error.message
        })

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }


    return res.status(StatusCodes.NO_CONTENT).send();
})

/**
 * Updates a company by id
 * @method PUT
 * @route PUT api/companies
 * 
 * @param {sessionid: string} req.cookies
 * @param {id: number} req.query
 * @param {fake_name: string, real_name: string, info?: string} req.body
 * 
 * @returns {StatusCodes.OK | StatusCodes.NOT_FOUND | StatusCodes.BAD_REQUEST | StatusCodes.CONFLICT | StatusCodes.INTERNAL_SERVER_ERROR}
 * @returns {{id: number, fake_name: string, real_name: string, info: string}} Company information
 */
router.put('/', SessionValidatorMW, QueryFieldChecker('id'), BodyFieldChecker('fake_name', 'real_name'), (req, res, next) => {
    const result = DataManagerInstance.UpdateCompany(parseInt(req.query?.id), req.body.fake_name, req.body.real_name, req.body.info);

    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.INPUT_NOT_VALID) return res.status(StatusCodes.BAD_REQUEST).json({
            error: result.error.message
        })

        if (result.error.code === DatabaseErrorCodes.COMPANY_NOT_FOUND) return res.status(StatusCodes.NOT_FOUND).json({
            error: result.error.message
        })

        if (result.error.code === DatabaseErrorCodes.SQLITE_CONSTRAINT_UNIQUE) return res.status(StatusCodes.CONFLICT).json({
            error: result.error.message
        })

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return res.status(StatusCodes.OK).json(result.data);
})
export { router }