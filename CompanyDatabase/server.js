import express from 'express';
const app = express();

import { ImportRoutes } from '#helpers/routeHelpers';
ImportRoutes(app, './routers')

import { PORT } from '#config';
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
})