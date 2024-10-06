import express from 'express';
import path from 'path';
import { root } from '#config';

const distPath = path.join(root, 'dist');

const router = express.Router();

router.get(['/', '/main'], (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
})

router.use('/', express.static(distPath));

export { router };