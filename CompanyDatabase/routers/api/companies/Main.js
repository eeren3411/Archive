import { BodyFieldChecker, QueryFieldChecker } from '#middleware/FieldCheckerMW';
import { DataManagerInstance, DatabaseErrorCodes } from '#managers/DataManager';
import { SessionValidatorMW } from '#middleware/SessionMW';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

const router = express.Router();
/**
 * Gets all companies or a company by id
 * @method GET
 * @route GET api/companies
 */
router.get('/', SessionValidatorMW, (req, res, next) => {
    if (!req.query?.id) {
        const result = DataManagerInstance.GetCompanies();
        if (result.error) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();

        return res.status(StatusCodes.OK).json(result.data);
    }

    const id = parseInt(req.query?.id);
    if (isNaN(id)) return res.status(StatusCodes.BAD_REQUEST).json({
        error: "ID must be a number"
    });

    const result = DataManagerInstance.GetCompany(id);
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
 */
router.delete('/', SessionValidatorMW, QueryFieldChecker('id'), (req, res, next) => {
    const id = parseInt(req.query?.id);
    if (isNaN(id)) return res.status(StatusCodes.BAD_REQUEST).json({
        error: "ID must be a number"
    })
    
    const result = DataManagerInstance.RemoveCompany(id);

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
 */
router.put('/', SessionValidatorMW, BodyFieldChecker('id', 'fake_name', 'real_name'), (req, res, next) => {
    const result = DataManagerInstance.UpdateCompany(req.body.id, req.body.fake_name, req.body.real_name, req.body.info);

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