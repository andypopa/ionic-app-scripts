"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpServer = void 0;
const path = require("path");
const injector_1 = require("./injector");
const live_reload_1 = require("./live-reload");
const express = require("express");
const fs = require("fs");
const url = require("url");
const serve_config_1 = require("./serve-config");
const logger_1 = require("../logger/logger");
const proxyMiddleware = require("proxy-middleware");
const logger_diagnostics_1 = require("../logger/logger-diagnostics");
const Constants = require("../util/constants");
const helpers_1 = require("../util/helpers");
const ionic_project_1 = require("../util/ionic-project");
const lab_1 = require("./lab");
/**
 * Create HTTP server
 */
function createHttpServer(config) {
    const app = express();
    app.set('serveConfig', config);
    app.get('/', serveIndex);
    app.use('/', express.static(config.wwwDir));
    app.use(`/${serve_config_1.LOGGER_DIR}`, express.static(path.join(__dirname, '..', '..', 'bin'), { maxAge: 31536000 }));
    // Lab routes
    app.use(serve_config_1.IONIC_LAB_URL + '/static', express.static(path.join(__dirname, '..', '..', 'lab', 'static')));
    app.get(serve_config_1.IONIC_LAB_URL, lab_1.LabAppView);
    app.get(serve_config_1.IONIC_LAB_URL + '/api/v1/cordova', lab_1.ApiCordovaProject);
    app.get(serve_config_1.IONIC_LAB_URL + '/api/v1/app-config', lab_1.ApiPackageJson);
    app.get('/cordova.js', servePlatformResource, serveMockCordovaJS);
    app.get('/cordova_plugins.js', servePlatformResource);
    app.get('/plugins/*', servePlatformResource);
    if (config.useProxy) {
        setupProxies(app);
    }
    return app;
}
exports.createHttpServer = createHttpServer;
function setupProxies(app) {
    if (helpers_1.getBooleanPropertyValue(Constants.ENV_READ_CONFIG_JSON)) {
        ionic_project_1.getProjectJson().then(function (projectConfig) {
            for (const proxy of projectConfig.proxies || []) {
                let opts = url.parse(proxy.proxyUrl);
                if (proxy.proxyNoAgent) {
                    opts.agent = false;
                }
                opts.rejectUnauthorized = !(proxy.rejectUnauthorized === false);
                opts.cookieRewrite = proxy.cookieRewrite;
                app.use(proxy.path, proxyMiddleware(opts));
                logger_1.Logger.info('Proxy added:' + proxy.path + ' => ' + url.format(opts));
            }
        }).catch((err) => {
            logger_1.Logger.error(`Failed to read the projects ionic.config.json file: ${err.message}`);
        });
    }
}
/**
 * http responder for /index.html base entrypoint
 */
function serveIndex(req, res) {
    const config = req.app.get('serveConfig');
    // respond with the index.html file
    const indexFileName = path.join(config.wwwDir, process.env[Constants.ENV_VAR_HTML_TO_SERVE]);
    fs.readFile(indexFileName, (err, indexHtml) => {
        if (!indexHtml) {
            logger_1.Logger.error(`Failed to load index.html`);
            res.send('try again later');
            return;
        }
        if (config.useLiveReload) {
            indexHtml = live_reload_1.injectLiveReloadScript(indexHtml, req.hostname, config.liveReloadPort);
            indexHtml = injector_1.injectNotificationScript(config.rootDir, indexHtml, config.notifyOnConsoleLog, config.notificationPort);
        }
        indexHtml = logger_diagnostics_1.injectDiagnosticsHtml(config.buildDir, indexHtml);
        res.set('Content-Type', 'text/html');
        res.send(indexHtml);
    });
}
/**
 * http responder for cordova.js file
 */
function serveMockCordovaJS(req, res) {
    res.set('Content-Type', 'application/javascript');
    res.send('// mock cordova file during development');
}
/**
 * Middleware to serve platform resources
 */
function servePlatformResource(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = req.app.get('serveConfig');
        const userAgent = req.header('user-agent');
        if (!config.isCordovaServe) {
            return next();
        }
        let root = yield getResourcePath(req.url, config, userAgent);
        if (root) {
            res.sendFile(req.url, { root });
        }
        else {
            next();
        }
    });
}
/**
 * Determines the appropriate resource path, and checks if the specified url
 *
 * @returns string of the resource path or undefined if there is no match
 */
function getResourcePath(url, config, userAgent) {
    return __awaiter(this, void 0, void 0, function* () {
        let searchPaths = [config.wwwDir];
        if (isUserAgentIOS(userAgent)) {
            searchPaths = serve_config_1.IOS_PLATFORM_PATHS.map(resourcePath => path.join(config.rootDir, resourcePath));
        }
        else if (isUserAgentAndroid(userAgent)) {
            searchPaths = serve_config_1.ANDROID_PLATFORM_PATHS.map(resourcePath => path.join(config.rootDir, resourcePath));
        }
        for (let i = 0; i < searchPaths.length; i++) {
            let checkPath = path.join(searchPaths[i], url);
            try {
                let result = yield checkFile(checkPath);
                return searchPaths[i];
            }
            catch (e) { }
        }
    });
}
/**
 * Checks if a file exists (responds to stat)
 */
function checkFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return reject();
            }
            resolve();
        });
    });
}
function isUserAgentIOS(ua) {
    ua = ua.toLowerCase();
    return (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || ua.indexOf('ipod') > -1);
}
function isUserAgentAndroid(ua) {
    ua = ua.toLowerCase();
    return ua.indexOf('android') > -1;
}
