import { DataManagerInstance, DatabaseErrorCodes } from '#managers/DataManager';
import { BodyArrayFieldChecker } from '#middleware/FieldCheckerMW';
import { SessionValidatorMW } from '#middleware/SessionMW';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

const router = express.Router();

/**
 * Gets all companies
 * @method GET
 * @route GET api/companies/bulk
 */
router.get('/bulk', SessionValidatorMW, (req, res, next) => {
    const result = DataManagerInstance.GetCompanies();

    if (result.error) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();

    return res.status(StatusCodes.OK).json(result.data);
})

/**
 * Inserts multiple companies at once
 * @method POST
 * @route POST api/companies/bulk
 * @param {[{fake_name: string, real_name: string}]} req.body - An array of companies
 */
router.post('/bulk', SessionValidatorMW, BodyArrayFieldChecker('fake_name', 'real_name'), (req, res, next) => {
    const result = DataManagerInstance.InsertCompanyBulk(req.body);

    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.INPUT_NOT_VALID) return res.status(StatusCodes.BAD_REQUEST).json({
            error: result.error.message
        })

        if (result.error.code === DatabaseErrorCodes.SQLITE_CONSTRAINT_UNIQUE) return res.status(StatusCodes.CONFLICT).json({
            error: result.error.message
        })

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return res.status(StatusCodes.CREATED).json(result.data);
})

/**
 * Updates multiple companies at once
 * @method PUT
 * @route PUT api/companies/bulk
 * @param {[{id: number, fake_name: string, real_name: string}]} req.body - An array of companies with id to update
 */
router.put('/bulk', SessionValidatorMW, BodyArrayFieldChecker('id', 'fake_name', 'real_name'), (req, res, next) => {
    const result = DataManagerInstance.UpdateCompanyBulk(req.body);

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

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    return res.status(StatusCodes.OK).json(result.data);
})

/**
 * Removes multiple companies at once
 * @method DELETE
 * @route DELETE api/companies/bulk
 * @param {[number]} req.body - An array of company ids
 */
router.delete('/bulk', SessionValidatorMW, (req, res, next) => {
    const result = DataManagerInstance.RemoveCompanyBulk(req.body);

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

export { router }