import { DataManagerInstance } from '#managers/DataManager';
import express from 'express';

const router = express.Router();

router.get('/salt', (req, res, next) => {
    res.json({
        salt: DataManagerInstance.GetConfig('salt') || null
    })

    return next();
});

export { router }