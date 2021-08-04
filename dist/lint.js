"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintUpdateWorker = exports.lintUpdate = exports.lintWorker = exports.lint = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const lint_utils_1 = require("./lint/lint-utils");
const lint_factory_1 = require("./lint/lint-factory");
const logger_1 = require("./logger/logger");
const config_1 = require("./util/config");
const constants_1 = require("./util/constants");
const helpers_1 = require("./util/helpers");
const transpile_1 = require("./transpile");
const worker_client_1 = require("./worker-client");
const taskInfo = {
    fullArg: '--tslint',
    shortArg: '-i',
    envVar: 'ionic_tslint',
    packageConfig: 'IONIC_TSLINT',
    defaultConfigFile: '../tslint'
};
function lint(context, tsLintConfig, typeCheck) {
    const logger = new logger_1.Logger('lint');
    return worker_client_1.runWorker('lint', 'lintWorker', context, { tsLintConfig, tsConfig: transpile_1.getTsConfigPath(context), typeCheck: typeCheck || helpers_1.getBooleanPropertyValue(constants_1.ENV_TYPE_CHECK_ON_LINT) })
        .then(() => {
        logger.finish();
    })
        .catch((err) => {
        if (helpers_1.getBooleanPropertyValue(constants_1.ENV_BAIL_ON_LINT_ERROR)) {
            throw logger.fail(err);
        }
        logger.finish();
    });
}
exports.lint = lint;
function lintWorker(context, { tsConfig, tsLintConfig, typeCheck }) {
    return getLintConfig(context, tsLintConfig)
        .then(tsLintConfig => lintApp(context, {
        tsConfig,
        tsLintConfig,
        typeCheck
    }));
}
exports.lintWorker = lintWorker;
function lintUpdate(changedFiles, context, typeCheck) {
    const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
    return worker_client_1.runWorker('lint', 'lintUpdateWorker', context, {
        typeCheck,
        tsConfig: transpile_1.getTsConfigPath(context),
        tsLintConfig: config_1.getUserConfigFile(context, taskInfo, null),
        filePaths: changedTypescriptFiles.map(changedTypescriptFile => changedTypescriptFile.filePath)
    });
}
exports.lintUpdate = lintUpdate;
function lintUpdateWorker(context, { tsConfig, tsLintConfig, filePaths, typeCheck }) {
    const program = lint_factory_1.createProgram(context, tsConfig);
    return getLintConfig(context, tsLintConfig)
        .then(tsLintConfig => lint_utils_1.lintFiles(context, program, tsLintConfig, filePaths, { typeCheck }))
        // Don't throw if linting failed
        .catch(() => { });
}
exports.lintUpdateWorker = lintUpdateWorker;
function lintApp(context, { tsConfig, tsLintConfig, typeCheck }) {
    const program = lint_factory_1.createProgram(context, tsConfig);
    const files = lint_factory_1.getFileNames(context, program);
    return lint_utils_1.lintFiles(context, program, tsLintConfig, files, { typeCheck });
}
function getLintConfig(context, tsLintConfig) {
    return new Promise((resolve, reject) => {
        tsLintConfig = config_1.getUserConfigFile(context, taskInfo, tsLintConfig);
        if (!tsLintConfig) {
            tsLintConfig = path_1.join(context.rootDir, 'tslint.json');
        }
        logger_1.Logger.debug(`tslint config: ${tsLintConfig}`);
        fs_1.access(tsLintConfig, (err) => {
            if (err) {
                // if the tslint.json file cannot be found that's fine, the
                // dev may not want to run tslint at all and to do that they
                // just don't have the file
                reject(err);
                return;
            }
            resolve(tsLintConfig);
        });
    });
}
