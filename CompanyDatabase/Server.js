import { DataManagerInstance } from '#managers/DataManager';
/**
 * Function to call before shutdown
 * @param {string} signal 
 * @param {any} reason 
 * @param {any} promise 
 */
function BeforeShutdown(signal, reason, promise) {
    console.log(`Received signal: ${signal}. Closing the application.`);
    if (reason && promise) {
        console.log(`Unhandled promise rejection at: ${promise}, reason: ${reason}`);
    } else if (reason) {
        console.log(`Uncaught exception: ${reason}`);
    }

    const result = DataManagerInstance.Dispose();

    if (result.error) {
        console.log(`Error occured database connection dispose: ${result.error}`);
    }

    process.exit(0);
}

['SIGINT', 'SIGTERM', 'SIGUSR1', 'SIGUSR2'].forEach(signal => {
    process.on(signal, () => BeforeShutdown(signal));
});
process.on('uncaughtException', (err) => {
    BeforeShutdown('uncaughtException', err);
});
process.on('unhandledRejection', (reason, promise) => {
    BeforeShutdown('unhandledRejection', reason, promise);
});

// Start expres server 
import express from 'express';
const app = express();

// Handle request syntax errors
import { StatusCodes } from 'http-status-codes';
app.use(express.json(), (err, req, res, next) => {
    if (err instanceof SyntaxError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: "Syntax Error!"
        });
    }
});

// Handle cookies
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Import routes
import { ImportRoutes } from '#helpers/RouteHelpers';
import expressListEndpoints from 'express-list-endpoints';
ImportRoutes(app, './routers').then(() => {
    console.log(expressListEndpoints(app));
})

// Listen
import { PORT } from '#config';
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
})