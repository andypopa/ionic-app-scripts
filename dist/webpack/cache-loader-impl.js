"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheLoader = void 0;
const path_1 = require("path");
const Constants = require("../util/constants");
const helpers_1 = require("../util/helpers");
function cacheLoader(source, map, webpackContex) {
    webpackContex.cacheable();
    const callback = webpackContex.async();
    try {
        const context = helpers_1.getContext();
        if (helpers_1.getBooleanPropertyValue(Constants.ENV_AOT_WRITE_TO_DISK)) {
            const jsPath = helpers_1.changeExtension(path_1.resolve(path_1.normalize(webpackContex.resourcePath)), '.js');
            const newSourceFile = { path: jsPath, content: source };
            context.fileCache.set(jsPath, newSourceFile);
            const mapPath = helpers_1.changeExtension(jsPath, '.js.map');
            const newMapFile = { path: mapPath, content: JSON.stringify(map) };
            context.fileCache.set(mapPath, newMapFile);
        }
        callback(null, source, map);
    }
    catch (ex) {
        callback(ex);
    }
}
exports.cacheLoader = cacheLoader;
