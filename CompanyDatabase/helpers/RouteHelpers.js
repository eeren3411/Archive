import express from 'express';
import fs from 'fs';
import path from 'path';
import { ROOT } from '#config';

/**
 * Imports routes from given path, RECURSIVELY
 * Given path is treated as base path, every folder inside the base path will have its own folder in application path
 * eg. basePath/router1.js -> app/router1Path
 * eg. basePath/temp/router2.js -> app/temp/router2Path
 * @param {express.Application} app  Express application
 * @param {string} basePath Base path to start recursion
 * @returns {Promise}
 */
export async function ImportRoutes(app, basePath) {
    async function walk(currentPath) {
        const promises = fs.readdirSync(currentPath).map(async file => {
            const filePath = path.join(currentPath, file);
            const fileStat = fs.statSync(filePath);

            if (fileStat.isDirectory()) {
                await walk(filePath);
                return;
            }

            const route = await import(`file://${path.join(ROOT, filePath)}`);
            const routePath = path.relative(basePath, currentPath).replaceAll('\\', '/');
            
            app.use(`/${routePath}`, route.router);
            console.log(`File ${file}, loaded into route /${routePath}`);
        })

        return Promise.all(promises);
    }

    await walk(basePath);
}