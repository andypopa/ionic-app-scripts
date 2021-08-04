"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseConfig = exports.buildCordovaConfig = void 0;
const fs = require("fs");
const xml2js = require("xml2js");
let lastConfig;
/**
 * Parse and build a CordovaProject config object by parsing the
 * config.xml file in the project root.
 */
exports.buildCordovaConfig = (errCb, cb) => {
    var parser = new xml2js.Parser();
    fs.readFile('config.xml', (err, data) => {
        if (err) {
            errCb(err);
            return;
        }
        parser.parseString(data, (err, result) => {
            if (err) {
                errCb(err);
                return;
            }
            cb(exports.parseConfig(result));
        });
    });
};
exports.parseConfig = (parsedConfig) => {
    if (!parsedConfig.widget) {
        return {};
    }
    let widget = parsedConfig.widget;
    // Widget attrs are defined on the <widget> tag
    let widgetAttrs = widget.$;
    let config = {
        name: widget.name[0]
    };
    if (widgetAttrs) {
        config.id = widgetAttrs.id;
        config.version = widgetAttrs.version;
    }
    lastConfig = config;
    return config;
};
