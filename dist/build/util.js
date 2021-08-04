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
exports.readPackageVersion = exports.readVersionOfDependencies = exports.validateRequiredFilesExist = exports.validateTsConfigSettings = exports.scanSrcTsFiles = void 0;
const path_1 = require("path");
const transpile_1 = require("../transpile");
const Constants = require("../util/constants");
const errors_1 = require("../util/errors");
const glob_util_1 = require("../util/glob-util");
const helpers_1 = require("../util/helpers");
function scanSrcTsFiles(context) {
    const srcGlob = path_1.join(context.srcDir, '**', '*.ts');
    const globs = [srcGlob];
    const deepLinkDir = helpers_1.getStringPropertyValue(Constants.ENV_VAR_DEEPLINKS_DIR);
    // these two will only not be equal in some weird cases like for building Ionic's demos with our current repository set-up
    if (deepLinkDir !== context.srcDir) {
        globs.push(path_1.join(deepLinkDir, '**', '*.ts'));
    }
    return glob_util_1.globAll(globs).then((results) => {
        const promises = results.map(result => {
            const promise = helpers_1.readFileAsync(result.absolutePath);
            promise.then((fileContent) => {
                context.fileCache.set(result.absolutePath, { path: result.absolutePath, content: fileContent });
            });
            return promise;
        });
        return Promise.all(promises);
    });
}
exports.scanSrcTsFiles = scanSrcTsFiles;
function validateTsConfigSettings(tsConfigFileContents) {
    return new Promise((resolve, reject) => {
        try {
            const isValid = tsConfigFileContents.options &&
                tsConfigFileContents.options.sourceMap === true;
            if (!isValid) {
                const error = new errors_1.BuildError(['The "tsconfig.json" file must have compilerOptions.sourceMap set to true.',
                    'For more information please see the default Ionic project tsconfig.json file here:',
                    'https://github.com/ionic-team/ionic2-app-base/blob/master/tsconfig.json'].join('\n'));
                error.isFatal = true;
                return reject(error);
            }
            resolve();
        }
        catch (e) {
            const error = new errors_1.BuildError('The "tsconfig.json" file contains malformed JSON.');
            error.isFatal = true;
            return reject(error);
        }
    });
}
exports.validateTsConfigSettings = validateTsConfigSettings;
function validateRequiredFilesExist(context) {
    return Promise.all([
        helpers_1.readFileAsync(process.env[Constants.ENV_APP_ENTRY_POINT]),
        transpile_1.getTsConfigAsync(context, process.env[Constants.ENV_TS_CONFIG])
    ]).catch((error) => {
        if (error.code === 'ENOENT' && error.path === process.env[Constants.ENV_APP_ENTRY_POINT]) {
            error = new errors_1.BuildError(`${error.path} was not found. The "main.dev.ts" and "main.prod.ts" files have been deprecated. Please create a new file "main.ts" containing the content of "main.dev.ts", and then delete the deprecated files.
                            For more information, please see the default Ionic project main.ts file here:
                            https://github.com/ionic-team/ionic2-app-base/tree/master/src/app/main.ts`);
            error.isFatal = true;
            throw error;
        }
        if (error.code === 'ENOENT' && error.path === process.env[Constants.ENV_TS_CONFIG]) {
            error = new errors_1.BuildError([`${error.path} was not found. The "tsconfig.json" file is missing. This file is required.`,
                'For more information please see the default Ionic project tsconfig.json file here:',
                'https://github.com/ionic-team/ionic2-app-base/blob/master/tsconfig.json'].join('\n'));
            error.isFatal = true;
            throw error;
        }
        error.isFatal = true;
        throw error;
    });
}
exports.validateRequiredFilesExist = validateRequiredFilesExist;
function readVersionOfDependencies(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // read the package.json version from ionic, angular/core, and typescript
        const promises = [];
        promises.push(readPackageVersion(context.angularCoreDir));
        if (!helpers_1.getBooleanPropertyValue(Constants.ENV_SKIP_IONIC_ANGULAR_VERSION)) {
            promises.push(readPackageVersion(context.ionicAngularDir));
        }
        promises.push(readPackageVersion(context.typescriptDir));
        const versions = yield Promise.all(promises);
        context.angularVersion = helpers_1.semverStringToObject(versions[0]);
        if (!helpers_1.getBooleanPropertyValue(Constants.ENV_SKIP_IONIC_ANGULAR_VERSION)) {
            context.ionicAngularVersion = helpers_1.semverStringToObject(versions[1]);
        }
        // index could be 1 or 2 depending on if you read ionic-angular, its always the last one bro
        context.typescriptVersion = helpers_1.semverStringToObject(versions[versions.length - 1]);
    });
}
exports.readVersionOfDependencies = readVersionOfDependencies;
function readPackageVersion(packageDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const packageJsonPath = path_1.join(packageDir, 'package.json');
        const packageObject = yield helpers_1.readJsonAsync(packageJsonPath);
        return packageObject['version'];
    });
}
exports.readPackageVersion = readPackageVersion;
