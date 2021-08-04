"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiPackageJson = exports.ApiCordovaProject = exports.LabAppView = void 0;
const path = require("path");
const cordova_config_1 = require("../util/cordova-config");
/**
 * Main Lab app view
 */
exports.LabAppView = (req, res) => {
    return res.sendFile('index.html', { root: path.join(__dirname, '..', '..', 'lab') });
};
exports.ApiCordovaProject = (req, res) => {
    cordova_config_1.buildCordovaConfig((err) => {
        res.status(400).json({ status: 'error', message: 'Unable to load config.xml' });
    }, (config) => {
        res.json(config);
    });
};
exports.ApiPackageJson = (req, res) => {
    res.sendFile(path.join(process.cwd(), 'package.json'), {
        headers: {
            'content-type': 'application/json'
        }
    });
};
