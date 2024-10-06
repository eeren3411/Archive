import express from 'express';
import fs from 'fs';
import path from 'path';
import { root } from '#config';

/**
 * Imports routes from given path, RECURSIVELY
 * Given path is treated as base path, every folder inside the base path will have its own folder in application path
 * eg. basePath/router1.js -> app/router1Path
 * eg. basePath/temp/router2.js -> app/temp/router2Path
 * @param {express.Application} app  Express application
 * @param {string} basePath Base path to start recursion
 * @returns {void}
 */
export function ImportRoutes(app, basePath) {
    function walk(currentPath) {
        fs.readdirSync(currentPath).forEach(async file => {
            const filePath = path.join(currentPath, file);
            const fileStat = fs.statSync(filePath);

            if (fileStat.isDirectory()) {
                walk(filePath);
                return;
            }

            const route = await import(`file://${path.join(root, filePath)}`);
            const routePath = path.relative(basePath, currentPath)
            
            app.use(`/${routePath}`, route.router);
            console.log(`File ${file}, loaded into route /${routePath}`);
        })
    }

    walk(basePath);
}