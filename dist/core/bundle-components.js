"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleCoreComponents = void 0;
const logger_1 = require("../logger/logger");
const fs = require("fs");
const path = require("path");
const nodeSass = require("node-sass");
const rollup = require("rollup");
const typescript = require("typescript");
const uglify = require("uglify-es");
const cleanCss = require("clean-css");
function bundleCoreComponents(context) {
    const compiler = getCoreCompiler(context);
    if (!compiler) {
        logger_1.Logger.debug(`skipping core component bundling`);
        return Promise.resolve();
    }
    const config = {
        srcDir: context.coreDir,
        destDir: context.buildDir,
        attrCase: 'lower',
        packages: {
            cleanCss: cleanCss,
            fs: fs,
            path: path,
            nodeSass: nodeSass,
            rollup: rollup,
            typescript: typescript,
            uglify: uglify
        },
        watch: context.isWatch
    };
    return compiler.bundle(config).then(results => {
        if (results.errors) {
            results.errors.forEach((err) => {
                logger_1.Logger.error(`compiler.bundle, results: ${err}`);
            });
        }
        else if (results.componentRegistry) {
            // add the component registry to the global window.Ionic
            context.ionicGlobal = context.ionicGlobal || {};
            context.ionicGlobal['components'] = results.componentRegistry;
        }
    }).catch(err => {
        if (err) {
            if (err.stack) {
                logger_1.Logger.error(`compiler.bundle: ${err.stack}`);
            }
            else {
                logger_1.Logger.error(`compiler.bundle: ${err}`);
            }
        }
        else {
            logger_1.Logger.error(`compiler.bundle error`);
        }
    });
}
exports.bundleCoreComponents = bundleCoreComponents;
function getCoreCompiler(context) {
    try {
        return require(context.coreCompilerFilePath);
    }
    catch (e) {
        logger_1.Logger.debug(`error loading core compiler: ${context.coreCompilerFilePath}, ${e}`);
    }
    return null;
}
