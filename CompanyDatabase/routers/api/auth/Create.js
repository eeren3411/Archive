import { DataManagerInstance } from '#managers/DataManager';
import { SessionManagerInstance } from '#managers/SessionManager';
import { StatusCodes } from 'http-status-codes';
import express from 'express';

const router = express.Router();

router.post('/create', (req, res) => {
    if (DataManagerInstance.GetConfig('salt')) {
        return res.status(StatusCodes.CONFLICT).json({
            error: "Database already exists"
        })
    }

    if (!req.body.salt && !req.body.checksum) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            error: "Missing parameters (Salt or Checksum)"
        })
    }

    DataManagerInstance.SetConfig('salt', req.body.salt.toString());
    DataManagerInstance.SetConfig('checksum', req.body.checksum.toString());

    res.status(StatusCodes.CREATED).json({
        salt: DataManagerInstance.GetConfig('salt'),
        checksum: DataManagerInstance.GetConfig('checksum'),
        SessionID: SessionManagerInstance.CreateSession(req)
    })
});

export { router }