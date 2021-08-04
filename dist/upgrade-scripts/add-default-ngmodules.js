"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndWriteNgModules = exports.readTsFiles = exports.getTsFilePaths = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("../deep-linking/util");
const config_1 = require("../util/config");
const Constants = require("../util/constants");
const glob_util_1 = require("../util/glob-util");
const helpers_1 = require("../util/helpers");
const typescript_utils_1 = require("../util/typescript-utils");
function getTsFilePaths(context) {
    const tsFileGlobString = path_1.join(context.srcDir, '**', '*.ts');
    return glob_util_1.globAll([tsFileGlobString]).then((results) => {
        return results.map(result => result.absolutePath);
    });
}
exports.getTsFilePaths = getTsFilePaths;
function readTsFiles(context, tsFilePaths) {
    const promises = tsFilePaths.map(tsFilePath => {
        const promise = helpers_1.readFileAsync(tsFilePath);
        promise.then((fileContent) => {
            context.fileCache.set(tsFilePath, { path: tsFilePath, content: fileContent });
        });
        return promise;
    });
    return Promise.all(promises);
}
exports.readTsFiles = readTsFiles;
function generateAndWriteNgModules(fileCache) {
    fileCache.getAll().forEach(file => {
        const sourceFile = typescript_utils_1.getTypescriptSourceFile(file.path, file.content);
        const deepLinkDecoratorData = util_1.getDeepLinkDecoratorContentForSourceFile(sourceFile);
        if (deepLinkDecoratorData) {
            // we have a valid DeepLink decorator
            const correspondingNgModulePath = util_1.getNgModulePathFromCorrespondingPage(file.path);
            const ngModuleFile = fileCache.get(correspondingNgModulePath);
            if (!ngModuleFile) {
                // the ngModule file does not exist, so go ahead and create a default one
                const defaultNgModuleContent = util_1.generateDefaultDeepLinkNgModuleContent(file.path, deepLinkDecoratorData.className);
                const ngModuleFilePath = helpers_1.changeExtension(file.path, helpers_1.getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX));
                fs_1.writeFileSync(ngModuleFilePath, defaultNgModuleContent);
            }
        }
    });
}
exports.generateAndWriteNgModules = generateAndWriteNgModules;
function run() {
    const context = config_1.generateContext();
    // find out what files to read
    return getTsFilePaths(context).then((filePaths) => {
        // read the files
        return readTsFiles(context, filePaths);
    }).then(() => {
        generateAndWriteNgModules(context.fileCache);
    });
}
run();
