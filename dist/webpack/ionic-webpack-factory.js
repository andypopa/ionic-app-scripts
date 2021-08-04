"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonChunksPlugin = exports.getSourceMapperFunction = exports.getIonicEnvironmentPlugin = void 0;
const common_chunks_plugins_1 = require("./common-chunks-plugins");
Object.defineProperty(exports, "getCommonChunksPlugin", { enumerable: true, get: function () { return common_chunks_plugins_1.getCommonChunksPlugin; } });
const ionic_environment_plugin_1 = require("./ionic-environment-plugin");
const source_mapper_1 = require("./source-mapper");
const helpers_1 = require("../util/helpers");
function getIonicEnvironmentPlugin() {
    const context = helpers_1.getContext();
    return new ionic_environment_plugin_1.IonicEnvironmentPlugin(context, true);
}
exports.getIonicEnvironmentPlugin = getIonicEnvironmentPlugin;
function getSourceMapperFunction() {
    return source_mapper_1.provideCorrectSourcePath;
}
exports.getSourceMapperFunction = getSourceMapperFunction;
