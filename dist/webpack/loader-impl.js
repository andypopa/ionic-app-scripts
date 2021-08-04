"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webpackLoader = void 0;
const path_1 = require("path");
const helpers_1 = require("../util/helpers");
const logger_1 = require("../logger/logger");
function webpackLoader(source, map, webpackContex) {
    webpackContex.cacheable();
    var callback = webpackContex.async();
    const context = helpers_1.getContext();
    const absolutePath = path_1.resolve(path_1.normalize(webpackContex.resourcePath));
    logger_1.Logger.debug(`[Webpack] webpackLoader: processing the following file: ${absolutePath}`);
    const javascriptPath = helpers_1.changeExtension(absolutePath, '.js');
    const sourceMapPath = javascriptPath + '.map';
    Promise.all([
        readFile(context.fileCache, javascriptPath),
        readFile(context.fileCache, sourceMapPath)
    ]).then(([javascriptFile, mapFile]) => {
        let sourceMapObject = map;
        if (mapFile) {
            try {
                sourceMapObject = JSON.parse(mapFile.content);
            }
            catch (ex) {
                logger_1.Logger.debug(`[Webpack] loader: Attempted to parse the JSON sourcemap for ${mapFile.path} and failed -
          using the original, webpack provided source map`);
            }
            if (sourceMapObject) {
                sourceMapObject.sources = [absolutePath];
                if (!sourceMapObject.sourcesContent || sourceMapObject.sourcesContent.length === 0) {
                    sourceMapObject.sourcesContent = [source];
                }
            }
        }
        callback(null, javascriptFile.content, sourceMapObject);
    }).catch(err => {
        logger_1.Logger.debug(`[Webpack] loader: Encountered an unexpected error: ${err.message}`);
        callback(err);
    });
}
exports.webpackLoader = webpackLoader;
function readFile(fileCache, filePath) {
    return helpers_1.readAndCacheFile(filePath).then((fileContent) => {
        logger_1.Logger.debug(`[Webpack] loader: Loaded ${filePath} successfully from disk`);
        return fileCache.get(filePath);
    }).catch(err => {
        logger_1.Logger.debug(`[Webpack] loader: Failed to load ${filePath} from disk`);
        throw err;
    });
}
