import { DataManagerInstance, DatabaseErrorCodes } from '#managers/DataManager';
import express from 'express';

const router = express.Router();

/**
 * Gets the salt from the database
 * @method GET
 * @route GET api/auth/salt
 * @returns {{salt: string | null}}
 */
router.get('/salt', (req, res, next) => {
    const result = DataManagerInstance.GetConfig('salt');
    if (result.error) {
        if (result.error.code === DatabaseErrorCodes.CONFIG_NOT_FOUND) return res.json({
            salt: null
        })

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }

    res.json({
        salt: result.data.value || null
    })

    return next();
});

export { router }