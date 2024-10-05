const express = require('express');
/**
 * Imports routes from given path, RECURSIVELY
 * Given path is treated as base path, every folder inside the base path will have its own folder in application path
 * eg. basePath/router1.js -> app/router1Path
 * eg. basePath/temp/router2.js -> app/temp/router2Path
 * @param {express.Application} app  Express application
 * @param {string} basePath Base path to start recursion
 * @returns {void}
 */
function ImportRoutes(app, basePath) {
    const fs = require('fs');
    const path = require('path');

    function walk(currentPath) {
        fs.readdirSync(currentPath).forEach(file => {
            const fullPath = path.join(currentPath, file);
            const fileStat = fs.statSync(fullPath);

            if (fileStat.isDirectory()) {
                walk(fullPath);
            }
            else if(fileStat.isFile()) {
                const route = require(`..\\${fullPath}`);
                const routePath = path.relative(basePath, currentPath)
                app.use(`/${routePath}`, route);
                console.log(`File ${file}, loaded into route /${routePath}`);
            }
        })
    }

    walk(basePath);
}

module.exports = {
    ImportRoutes: ImportRoutes,
}