require('module-alias/register')

const config = require('config');

const express = require('express');
const app = express();

const routeHelpers = require('./helpers/routeHelpers');
routeHelpers.ImportRoutes(app, './routers')

app.listen(config.PORT, () => {
    console.log(`Server listening on port: ${config.PORT}`);
})