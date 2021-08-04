"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformTsForDeepLinking = exports.runNgc = exports.ngcWorker = exports.ngc = void 0;
const aot_compiler_1 = require("./aot/aot-compiler");
const util_1 = require("./deep-linking/util");
const logger_1 = require("./logger/logger");
const config_1 = require("./util/config");
const Constants = require("./util/constants");
const helpers_1 = require("./util/helpers");
function ngc(context, configFile) {
    configFile = config_1.getUserConfigFile(context, taskInfo, configFile);
    const logger = new logger_1.Logger('ngc');
    return ngcWorker(context, configFile)
        .then(() => {
        logger.finish();
    })
        .catch(err => {
        throw logger.fail(err);
    });
}
exports.ngc = ngc;
function ngcWorker(context, configFile) {
    return transformTsForDeepLinking(context).then(() => {
        return runNgc(context, configFile);
    });
}
exports.ngcWorker = ngcWorker;
function runNgc(context, configFile) {
    return aot_compiler_1.runAot(context, { entryPoint: process.env[Constants.ENV_APP_ENTRY_POINT],
        rootDir: context.rootDir,
        tsConfigPath: process.env[Constants.ENV_TS_CONFIG],
        appNgModuleClass: process.env[Constants.ENV_APP_NG_MODULE_CLASS],
        appNgModulePath: process.env[Constants.ENV_APP_NG_MODULE_PATH]
    });
}
exports.runNgc = runNgc;
function transformTsForDeepLinking(context) {
    if (helpers_1.getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS)) {
        const tsFiles = util_1.filterTypescriptFilesForDeepLinks(context.fileCache);
        tsFiles.forEach(tsFile => {
            tsFile.content = util_1.purgeDeepLinkDecorator(tsFile.content);
        });
        const tsFile = context.fileCache.get(helpers_1.getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH));
        if (!util_1.hasExistingDeepLinkConfig(tsFile.path, tsFile.content)) {
            const deepLinkString = util_1.convertDeepLinkConfigEntriesToString(helpers_1.getParsedDeepLinkConfig());
            tsFile.content = util_1.getUpdatedAppNgModuleContentWithDeepLinkConfig(tsFile.path, tsFile.content, deepLinkString);
        }
    }
    return Promise.resolve();
}
exports.transformTsForDeepLinking = transformTsForDeepLinking;
const taskInfo = {
    fullArg: '--ngc',
    shortArg: '-n',
    envVar: 'IONIC_NGC',
    packageConfig: 'ionic_ngc',
    defaultConfigFile: null
};
