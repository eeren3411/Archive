import { DataManagerInstance } from '#managers/DataManager';
import { SessionValidatorMW } from '#middleware/SessionMW';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

/**
 * Checks if the real_name and fake_name exists in the request body.
 * Returns 422 if the parameters are missing.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function CompanyRulesMW(req, res, next) {
    if (!req.body?.real_name ||
        !req.body?.fake_name
    ) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            error: "Missing parameters (Real Name or Fake Name)"
        })
    }

    return next();
}

const router = express.Router();

/**
 * Gets all companies
 * @method GET
 * @route GET api/companies
 */
router.get('/', SessionValidatorMW, (req, res, next) => {
    const result = DataManagerInstance.GetCompanies();
    res.status(StatusCodes.OK).json(result);
})

/**
 * Creates a new company
 * @method POST
 * @route POST api/companies
 */
router.post('/', SessionValidatorMW, CompanyRulesMW,(req, res, next) => {
    try {
        DataManagerInstance.InsertCompany(req.body.fake_name, req.body.real_name, req.body.info);

        return res.status(StatusCodes.CREATED).json({
            fake_name: req.body.fake_name,
            real_name: req.body.real_name,
            info: req.body.info
        });
    } catch (err) {
        if (err.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err;
        
        return res.status(StatusCodes.CONFLICT).json({
            error: `Fake Name ${req.body.fake_name} already exists`
        })
    }
});

/**
 * Gets a company by id
 * @method GET
 * @route GET api/companies/:id
 */
router.get('/:id', SessionValidatorMW, (req, res, next) => {
    const result = DataManagerInstance.GetCompany(req.params.id);

    if (!result) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: `Company with id "${req.params.id}" not found!`
        });
    }

    return res.status(StatusCodes.OK).json(result);
})

/**
 * Removes a company by id
 * @method DELETE
 * @route DELETE api/companies/:id
 */
router.delete('/:id', SessionValidatorMW, (req, res, next) => {
    const result = DataManagerInstance.RemoveCompany(req.params.id);

    if (!result) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: `Company with id ${req.params.id} not found!`
        });
    }

    return res.status(StatusCodes.NO_CONTENT).send();
})

/**
 * Updates a company by id
 * @method PUT
 * @route PUT api/companies/:id
 */
router.put('/:id', SessionValidatorMW, CompanyRulesMW, (req, res, next) => {
    try {
        const result = DataManagerInstance.UpdateCompany(req.params.id, req.body.fake_name, req.body.real_name, req.body.info);

        if (!result) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: `Company with id ${req.params.id} not found!`
            });
        }
    
        return res.status(StatusCodes.OK).json({
            id: req.params.id,
            fake_name: req.body.fake_name,
            real_name: req.body.real_name,
            info: req.body.info
        });
    } catch (err) {
        if (err.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err;
        
        return res.status(StatusCodes.CONFLICT).json({
            error: `Fake Name ${req.body.fake_name} already exists`
        })
    }
})
export { router }