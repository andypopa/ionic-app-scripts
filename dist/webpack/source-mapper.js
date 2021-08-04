"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideCorrectSourcePath = void 0;
const helpers_1 = require("../util/helpers");
const path_1 = require("path");
const constants_1 = require("../util/constants");
function provideCorrectSourcePath(webpackObj) {
    const context = helpers_1.getContext();
    return provideCorrectSourcePathInternal(webpackObj, context);
}
exports.provideCorrectSourcePath = provideCorrectSourcePath;
function provideCorrectSourcePathInternal(webpackObj, context) {
    const webpackResourcePath = webpackObj.resourcePath;
    const noTilde = webpackResourcePath.replace(/~/g, 'node_modules');
    const absolutePath = path_1.resolve(path_1.normalize(noTilde));
    if (process.env[constants_1.ENV_VAR_SOURCE_MAP_TYPE] === constants_1.SOURCE_MAP_TYPE_CHEAP) {
        const mapPath = path_1.sep + absolutePath;
        return helpers_1.toUnixPath(mapPath);
    }
    // does the full map
    const backPath = path_1.relative(context.buildDir, context.rootDir);
    const relativePath = path_1.relative(context.rootDir, absolutePath);
    const relativeToBuildDir = path_1.join(backPath, relativePath);
    return helpers_1.toUnixPath(relativeToBuildDir);
}
