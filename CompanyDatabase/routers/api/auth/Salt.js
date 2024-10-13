import { DataManagerInstance } from '#managers/DataManager';
import express from 'express';

const router = express.Router();

router.get('/salt', (req, res) => {
    res.json({
        salt: DataManagerInstance.GetConfig('salt') || null
    })
});

export { router }