import { DataManagerInstance } from "#managers/DataManager";
import { SessionManagerInstance } from "#managers/SessionManager";
import { StatusCodes } from "http-status-codes";
import express from "express";

const router = express.Router();

router.post('/login', (req, res) => {
    const checksum = DataManagerInstance.GetConfig('checksum');
    if (!checksum) {
        return res.status(StatusCodes.NOT_FOUND).json({
            error: "Database does not exist"
        })
    }

    if (checksum !== req.body.checksum) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            error: "Invalid checksum"
        })
    }
    
    res.status(StatusCodes.OK).json({
        SessionID: SessionManagerInstance.CreateSession(req)
    })
})

export { router }