import express from 'express';
const app = express();

import { ImportRoutes } from '#helpers/RouteHelpers';
ImportRoutes(app, './routers')

import { PORT } from '#config';
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
})