const PORT = 3411

const express = require('express');
const app = express();

const routeHelpers = require('./helpers/routeHelpers');
routeHelpers.ImportRoutes(app, './routers')

app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
})