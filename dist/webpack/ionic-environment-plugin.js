"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertDeepLinkConfigToWebpackFormat = exports.IonicEnvironmentPlugin = void 0;
const path_1 = require("path");
const Constants = require("../util/constants");
const helpers_1 = require("../util/helpers");
const logger_1 = require("../logger/logger");
const hybrid_file_system_factory_1 = require("../util/hybrid-file-system-factory");
const watch_memory_system_1 = require("./watch-memory-system");
const ContextElementDependency = require('webpack/lib/dependencies/ContextElementDependency');
class IonicEnvironmentPlugin {
    constructor(context, writeToDisk) {
        this.context = context;
        this.writeToDisk = writeToDisk;
    }
    apply(compiler) {
        compiler.plugin('context-module-factory', (contextModuleFactory) => {
            contextModuleFactory.plugin('after-resolve', (result, callback) => {
                if (!result) {
                    return callback();
                }
                const deepLinkConfig = helpers_1.getParsedDeepLinkConfig();
                const webpackDeepLinkModuleDictionary = convertDeepLinkConfigToWebpackFormat(deepLinkConfig);
                const ionicAngularDir = helpers_1.getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_DIR);
                const ngModuleLoaderDirectory = path_1.join(ionicAngularDir, 'util');
                if (!result.resource.endsWith(ngModuleLoaderDirectory)) {
                    return callback(null, result);
                }
                result.resource = this.context.srcDir;
                result.recursive = true;
                result.dependencies.forEach((dependency) => dependency.critical = false);
                result.resolveDependencies = (p1, p2, p3, p4, cb) => {
                    const dependencies = Object.keys(webpackDeepLinkModuleDictionary)
                        .map((key) => {
                        const value = webpackDeepLinkModuleDictionary[key];
                        if (value) {
                            return new ContextElementDependency(value, key);
                        }
                        return null;
                    }).filter(dependency => !!dependency);
                    cb(null, dependencies);
                };
                return callback(null, result);
            });
        });
        compiler.plugin('environment', (otherCompiler, callback) => {
            logger_1.Logger.debug('[IonicEnvironmentPlugin] apply: creating environment plugin');
            const hybridFileSystem = hybrid_file_system_factory_1.getInstance(this.writeToDisk);
            hybridFileSystem.setInputFileSystem(compiler.inputFileSystem);
            hybridFileSystem.setOutputFileSystem(compiler.outputFileSystem);
            compiler.inputFileSystem = hybridFileSystem;
            compiler.outputFileSystem = hybridFileSystem;
            compiler.watchFileSystem = new watch_memory_system_1.WatchMemorySystem(this.context.fileCache, this.context.srcDir);
            // do a bunch of webpack specific stuff here, so cast to an any
            // populate the content of the file system with any virtual files
            // inspired by populateWebpackResolver method in Angular's webpack plugin
            const webpackFileSystem = hybridFileSystem;
            const fileStatsDictionary = hybridFileSystem.getAllFileStats();
            const dirStatsDictionary = hybridFileSystem.getAllDirStats();
            this.initializeWebpackFileSystemCaches(webpackFileSystem);
            for (const filePath of Object.keys(fileStatsDictionary)) {
                const stats = fileStatsDictionary[filePath];
                webpackFileSystem._statStorage.data[filePath] = [null, stats];
                webpackFileSystem._readFileStorage.data[filePath] = [null, stats.content];
            }
            for (const dirPath of Object.keys(dirStatsDictionary)) {
                const stats = dirStatsDictionary[dirPath];
                const fileNames = hybridFileSystem.getFileNamesInDirectory(dirPath);
                const dirNames = hybridFileSystem.getSubDirs(dirPath);
                webpackFileSystem._statStorage.data[dirPath] = [null, stats];
                webpackFileSystem._readdirStorage.data[dirPath] = [null, fileNames.concat(dirNames)];
            }
        });
    }
    initializeWebpackFileSystemCaches(webpackFileSystem) {
        if (!webpackFileSystem._statStorage) {
            webpackFileSystem._statStorage = {};
        }
        if (!webpackFileSystem._statStorage.data) {
            webpackFileSystem._statStorage.data = [];
        }
        if (!webpackFileSystem._readFileStorage) {
            webpackFileSystem._readFileStorage = {};
        }
        if (!webpackFileSystem._readFileStorage.data) {
            webpackFileSystem._readFileStorage.data = [];
        }
        if (!webpackFileSystem._readdirStorage) {
            webpackFileSystem._readdirStorage = {};
        }
        if (!webpackFileSystem._readdirStorage.data) {
            webpackFileSystem._readdirStorage.data = [];
        }
    }
}
exports.IonicEnvironmentPlugin = IonicEnvironmentPlugin;
function convertDeepLinkConfigToWebpackFormat(parsedDeepLinkConfigs) {
    const dictionary = {};
    if (!parsedDeepLinkConfigs) {
        parsedDeepLinkConfigs = new Map();
    }
    parsedDeepLinkConfigs.forEach(parsedDeepLinkConfig => {
        if (parsedDeepLinkConfig.userlandModulePath && parsedDeepLinkConfig.absolutePath) {
            dictionary[parsedDeepLinkConfig.userlandModulePath] = parsedDeepLinkConfig.absolutePath;
        }
    });
    return dictionary;
}
exports.convertDeepLinkConfigToWebpackFormat = convertDeepLinkConfigToWebpackFormat;
