import { DataManagerInstance } from '#managers/DataManager';
import express from 'express';

const router = express.Router();

router.get('/salt', (req, res, next) => {
    const result = DataManagerInstance.GetConfig('salt');
    if (result.error) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();

    res.json({
        salt: result.data || null
    })

    return next();
});

export { router }