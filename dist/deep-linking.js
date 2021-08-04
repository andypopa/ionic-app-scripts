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
exports.hasAppModuleChanged = exports.getAppMainNgModuleFile = exports.deepLinkingWorkerFullUpdate = exports.deepLinkingUpdateImpl = exports.deepLinkingUpdate = exports.deepLinkingWorkerImpl = exports.deepLinking = exports.setExistingDeepLinkConfig = exports.existingDeepLinkConfigString = void 0;
const path_1 = require("path");
const logger_1 = require("./logger/logger");
const Constants = require("./util/constants");
const errors_1 = require("./util/errors");
const helpers_1 = require("./util/helpers");
const interfaces_1 = require("./util/interfaces");
const util_1 = require("./deep-linking/util");
exports.existingDeepLinkConfigString = null;
function setExistingDeepLinkConfig(newString) {
    exports.existingDeepLinkConfigString = newString;
}
exports.setExistingDeepLinkConfig = setExistingDeepLinkConfig;
function deepLinking(context) {
    const logger = new logger_1.Logger(`deeplinks`);
    return deepLinkingWorker(context).then((map) => {
        helpers_1.setParsedDeepLinkConfig(map);
        logger.finish();
    })
        .catch((err) => {
        const error = new errors_1.BuildError(err.message);
        error.isFatal = true;
        throw logger.fail(error);
    });
}
exports.deepLinking = deepLinking;
function deepLinkingWorker(context) {
    return deepLinkingWorkerImpl(context, []);
}
function deepLinkingWorkerImpl(context, changedFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        // get the app.module.ts content from ideally the cache, but fall back to disk if needed
        const appNgModulePath = helpers_1.getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH);
        const appNgModuleFileContent = yield getAppMainNgModuleFile(appNgModulePath);
        // is there is an existing (legacy) deep link config, just move on and don't look for decorators
        const hasExisting = util_1.hasExistingDeepLinkConfig(appNgModulePath, appNgModuleFileContent);
        if (hasExisting) {
            return new Map();
        }
        // okay cool, we need to get the data from each file
        const results = util_1.getDeepLinkData(appNgModulePath, context.fileCache, context.runAot) || new Map();
        const newDeepLinkString = util_1.convertDeepLinkConfigEntriesToString(results);
        if (!exports.existingDeepLinkConfigString || newDeepLinkString !== exports.existingDeepLinkConfigString || hasAppModuleChanged(changedFiles, appNgModulePath)) {
            exports.existingDeepLinkConfigString = newDeepLinkString;
            if (changedFiles) {
                changedFiles.push({
                    event: 'change',
                    filePath: appNgModulePath,
                    ext: path_1.extname(appNgModulePath).toLowerCase()
                });
            }
        }
        return results;
    });
}
exports.deepLinkingWorkerImpl = deepLinkingWorkerImpl;
function deepLinkingUpdate(changedFiles, context) {
    if (context.deepLinkState === interfaces_1.BuildState.RequiresBuild) {
        return deepLinkingWorkerFullUpdate(context);
    }
    else {
        return deepLinkingUpdateImpl(changedFiles, context);
    }
}
exports.deepLinkingUpdate = deepLinkingUpdate;
function deepLinkingUpdateImpl(changedFiles, context) {
    const tsFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
    if (tsFiles.length === 0) {
        return Promise.resolve();
    }
    const logger = new logger_1.Logger('deeplinks update');
    return deepLinkingWorkerImpl(context, changedFiles).then((map) => {
        // okay, now that the existing config is updated, go ahead and reset it
        helpers_1.setParsedDeepLinkConfig(map);
        logger.finish();
    }).catch((err) => {
        logger_1.Logger.warn(err.message);
        const error = new errors_1.BuildError(err.message);
        throw logger.fail(error);
    });
}
exports.deepLinkingUpdateImpl = deepLinkingUpdateImpl;
function deepLinkingWorkerFullUpdate(context) {
    const logger = new logger_1.Logger(`deeplinks update`);
    return deepLinkingWorker(context).then((map) => {
        helpers_1.setParsedDeepLinkConfig(map);
        logger.finish();
    })
        .catch((err) => {
        logger_1.Logger.warn(err.message);
        const error = new errors_1.BuildError(err.message);
        throw logger.fail(error);
    });
}
exports.deepLinkingWorkerFullUpdate = deepLinkingWorkerFullUpdate;
function getAppMainNgModuleFile(appNgModulePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield helpers_1.readAndCacheFile(appNgModulePath);
        }
        catch (ex) {
            throw new Error(`The main app NgModule was not found at the following path: ${appNgModulePath}`);
        }
    });
}
exports.getAppMainNgModuleFile = getAppMainNgModuleFile;
function hasAppModuleChanged(changedFiles, appNgModulePath) {
    if (!changedFiles) {
        changedFiles = [];
    }
    for (const changedFile of changedFiles) {
        if (changedFile.filePath === appNgModulePath) {
            return true;
        }
    }
    return false;
}
exports.hasAppModuleChanged = hasAppModuleChanged;
