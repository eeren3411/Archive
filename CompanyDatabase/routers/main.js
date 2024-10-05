const express = require('express')
const path = require('path');
const config = require('config');
const distPath = path.join(config.root, 'dist');

const router = express.Router();

router.get(['/', '/main'], (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
})

router.use('/', express.static(distPath));

module.exports = router;