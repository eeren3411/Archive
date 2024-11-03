import express from 'express';
import path from 'path';
import { ROOT } from '#config';

const distPath = path.join(ROOT, 'dist');

const router = express.Router();

/**
 * Main router which serves the website
 * @method GET
 * @route GET /main
 */
router.get(['/', '/main'], (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
})

router.use('/', express.static(distPath));

export { router };