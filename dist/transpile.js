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
exports.getTsConfigPath = exports.inMemoryFileCopySuffix = exports.resetSourceFiles = exports.copyOriginalSourceFiles = exports.transformSource = exports.transpileTsString = exports.getTsConfig = exports.getTsConfigAsync = exports.transpileDiagnosticsOnly = exports.canRunTranspileUpdate = exports.transpileWorker = exports.transpileUpdate = exports.transpile = void 0;
const child_process_1 = require("child_process");
const events_1 = require("events");
const fs_1 = require("fs");
const path = require("path");
const ts = require("typescript");
const compiler_host_factory_1 = require("./aot/compiler-host-factory");
const bundle_1 = require("./bundle");
const util_1 = require("./deep-linking/util");
const logger_1 = require("./logger/logger");
const logger_diagnostics_1 = require("./logger/logger-diagnostics");
const logger_typescript_1 = require("./logger/logger-typescript");
const template_1 = require("./template");
const Constants = require("./util/constants");
const errors_1 = require("./util/errors");
const helpers_1 = require("./util/helpers");
const interfaces_1 = require("./util/interfaces");
function transpile(context) {
    const workerConfig = {
        configFile: getTsConfigPath(context),
        writeInMemory: true,
        sourceMaps: true,
        cache: true,
        inlineTemplate: context.inlineTemplates,
        useTransforms: true
    };
    const logger = new logger_1.Logger('transpile');
    return transpileWorker(context, workerConfig)
        .then(() => {
        context.transpileState = interfaces_1.BuildState.SuccessfulBuild;
        logger.finish();
    })
        .catch(err => {
        context.transpileState = interfaces_1.BuildState.RequiresBuild;
        throw logger.fail(err);
    });
}
exports.transpile = transpile;
function transpileUpdate(changedFiles, context) {
    const workerConfig = {
        configFile: getTsConfigPath(context),
        writeInMemory: true,
        sourceMaps: true,
        cache: false,
        inlineTemplate: context.inlineTemplates,
        useTransforms: true
    };
    const logger = new logger_1.Logger('transpile update');
    const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
    const promises = [];
    for (const changedTypescriptFile of changedTypescriptFiles) {
        promises.push(transpileUpdateWorker(changedTypescriptFile.event, changedTypescriptFile.filePath, context, workerConfig));
    }
    return Promise.all(promises)
        .then(() => {
        context.transpileState = interfaces_1.BuildState.SuccessfulBuild;
        logger.finish();
    })
        .catch(err => {
        context.transpileState = interfaces_1.BuildState.RequiresBuild;
        throw logger.fail(err);
    });
}
exports.transpileUpdate = transpileUpdate;
/**
 * The full TS build for all app files.
 */
function transpileWorker(context, workerConfig) {
    // let's do this
    return new Promise((resolve, reject) => {
        logger_diagnostics_1.clearDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript);
        // get the tsconfig data
        const tsConfig = getTsConfig(context, workerConfig.configFile);
        if (workerConfig.sourceMaps === false) {
            // the worker config say, "hey, don't ever bother making a source map, because."
            tsConfig.options.sourceMap = false;
        }
        else {
            // build the ts source maps if the bundler is going to use source maps
            tsConfig.options.sourceMap = bundle_1.buildJsSourceMaps(context);
        }
        // collect up all the files we need to transpile, tsConfig itself does all this for us
        const tsFileNames = cleanFileNames(context, tsConfig.fileNames);
        // for dev builds let's not create d.ts files
        tsConfig.options.declaration = undefined;
        // let's start a new tsFiles object to cache all the transpiled files in
        const host = compiler_host_factory_1.getFileSystemCompilerHostInstance(tsConfig.options);
        if (workerConfig.useTransforms && helpers_1.getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS)) {
            // beforeArray.push(purgeDeepLinkDecoratorTSTransform());
            // beforeArray.push(getInjectDeepLinkConfigTypescriptTransform());
            // temporarily copy the files to a new location
            copyOriginalSourceFiles(context.fileCache);
            // okay, purge the deep link files NOT using a transform
            const deepLinkFiles = util_1.filterTypescriptFilesForDeepLinks(context.fileCache);
            deepLinkFiles.forEach(file => {
                file.content = util_1.purgeDeepLinkDecorator(file.content);
            });
            const file = context.fileCache.get(helpers_1.getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH));
            const hasExisting = util_1.hasExistingDeepLinkConfig(file.path, file.content);
            if (!hasExisting) {
                const deepLinkString = util_1.convertDeepLinkConfigEntriesToString(helpers_1.getParsedDeepLinkConfig());
                file.content = util_1.getUpdatedAppNgModuleContentWithDeepLinkConfig(file.path, file.content, deepLinkString);
            }
        }
        const program = ts.createProgram(tsFileNames, tsConfig.options, host, cachedProgram);
        resetSourceFiles(context.fileCache);
        const beforeArray = [];
        program.emit(undefined, (path, data, writeByteOrderMark, onError, sourceFiles) => {
            if (workerConfig.writeInMemory) {
                writeTranspiledFilesCallback(context.fileCache, path, data, workerConfig.inlineTemplate);
            }
        });
        // cache the typescript program for later use
        cachedProgram = program;
        const tsDiagnostics = program.getSyntacticDiagnostics()
            .concat(program.getSemanticDiagnostics())
            .concat(program.getOptionsDiagnostics());
        const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, tsDiagnostics);
        if (diagnostics.length) {
            // darn, we've got some things wrong, transpile failed :(
            logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, true, true);
            reject(new errors_1.BuildError('Failed to transpile program'));
        }
        else {
            // transpile success :)
            resolve();
        }
    });
}
exports.transpileWorker = transpileWorker;
function canRunTranspileUpdate(event, filePath, context) {
    if (event === 'change' && context.fileCache) {
        return context.fileCache.has(path.resolve(filePath));
    }
    return false;
}
exports.canRunTranspileUpdate = canRunTranspileUpdate;
/**
 * Iterative build for one TS file. If it's not an existing file change, or
 * something errors out then it falls back to do the full build.
 */
function transpileUpdateWorker(event, filePath, context, workerConfig) {
    try {
        logger_diagnostics_1.clearDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript);
        filePath = path.normalize(path.resolve(filePath));
        // an existing ts file we already know about has changed
        // let's "TRY" to do a single module build for this one file
        if (!cachedTsConfig) {
            cachedTsConfig = getTsConfig(context, workerConfig.configFile);
        }
        // build the ts source maps if the bundler is going to use source maps
        cachedTsConfig.options.sourceMap = bundle_1.buildJsSourceMaps(context);
        const beforeArray = [];
        const transpileOptions = {
            compilerOptions: cachedTsConfig.options,
            fileName: filePath,
            reportDiagnostics: true,
        };
        // let's manually transpile just this one ts file
        // since it is an update, it's in memory already
        const sourceText = context.fileCache.get(filePath).content;
        const textToTranspile = workerConfig.useTransforms && helpers_1.getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS) ? transformSource(filePath, sourceText) : sourceText;
        // transpile this one module
        const transpileOutput = ts.transpileModule(textToTranspile, transpileOptions);
        const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, transpileOutput.diagnostics);
        if (diagnostics.length) {
            logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, false, true);
            // darn, we've got some errors with this transpiling :(
            // but at least we reported the errors like really really fast, so there's that
            logger_1.Logger.debug(`transpileUpdateWorker: transpileModule, diagnostics: ${diagnostics.length}`);
            throw new errors_1.BuildError(`Failed to transpile file - ${filePath}`);
        }
        else {
            // convert the path to have a .js file extension for consistency
            const newPath = helpers_1.changeExtension(filePath, '.js');
            const sourceMapFile = { path: newPath + '.map', content: transpileOutput.sourceMapText };
            let jsContent = transpileOutput.outputText;
            if (workerConfig.inlineTemplate) {
                // use original path for template inlining
                jsContent = template_1.inlineTemplate(transpileOutput.outputText, filePath);
            }
            const jsFile = { path: newPath, content: jsContent };
            const tsFile = { path: filePath, content: sourceText };
            context.fileCache.set(sourceMapFile.path, sourceMapFile);
            context.fileCache.set(jsFile.path, jsFile);
            context.fileCache.set(tsFile.path, tsFile);
        }
        return Promise.resolve();
    }
    catch (ex) {
        return Promise.reject(ex);
    }
}
function transpileDiagnosticsOnly(context) {
    return new Promise(resolve => {
        workerEvent.once('DiagnosticsWorkerDone', () => {
            resolve();
        });
        runDiagnosticsWorker(context);
    });
}
exports.transpileDiagnosticsOnly = transpileDiagnosticsOnly;
const workerEvent = new events_1.EventEmitter();
let diagnosticsWorker = null;
function runDiagnosticsWorker(context) {
    if (!diagnosticsWorker) {
        const workerModule = path.join(__dirname, 'transpile-worker.js');
        diagnosticsWorker = child_process_1.fork(workerModule, [], { env: { FORCE_COLOR: true } });
        logger_1.Logger.debug(`diagnosticsWorker created, pid: ${diagnosticsWorker.pid}`);
        diagnosticsWorker.on('error', (err) => {
            logger_1.Logger.error(`diagnosticsWorker error, pid: ${diagnosticsWorker.pid}, error: ${err}`);
            workerEvent.emit('DiagnosticsWorkerDone');
        });
        diagnosticsWorker.on('exit', (code) => {
            logger_1.Logger.debug(`diagnosticsWorker exited, pid: ${diagnosticsWorker.pid}`);
            diagnosticsWorker = null;
        });
        diagnosticsWorker.on('message', (msg) => {
            workerEvent.emit('DiagnosticsWorkerDone');
        });
    }
    const msg = {
        rootDir: context.rootDir,
        buildDir: context.buildDir,
        configFile: getTsConfigPath(context)
    };
    diagnosticsWorker.send(msg);
}
function cleanFileNames(context, fileNames) {
    // make sure we're not transpiling the prod when dev and stuff
    return fileNames;
}
function writeTranspiledFilesCallback(fileCache, sourcePath, data, shouldInlineTemplate) {
    sourcePath = path.normalize(path.resolve(sourcePath));
    if (sourcePath.endsWith('.js')) {
        let file = fileCache.get(sourcePath);
        if (!file) {
            file = { content: '', path: sourcePath };
        }
        if (shouldInlineTemplate) {
            file.content = template_1.inlineTemplate(data, sourcePath);
        }
        else {
            file.content = data;
        }
        fileCache.set(sourcePath, file);
    }
    else if (sourcePath.endsWith('.js.map')) {
        let file = fileCache.get(sourcePath);
        if (!file) {
            file = { content: '', path: sourcePath };
        }
        file.content = data;
        fileCache.set(sourcePath, file);
    }
}
function getTsConfigAsync(context, tsConfigPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getTsConfig(context, tsConfigPath);
    });
}
exports.getTsConfigAsync = getTsConfigAsync;
function getTsConfig(context, tsConfigPath) {
    let config = null;
    tsConfigPath = tsConfigPath || getTsConfigPath(context);
    const tsConfigFile = ts.readConfigFile(tsConfigPath, path => fs_1.readFileSync(path, 'utf8'));
    if (!tsConfigFile) {
        throw new errors_1.BuildError(`tsconfig: invalid tsconfig file, "${tsConfigPath}"`);
    }
    else if (tsConfigFile.error && tsConfigFile.error.messageText) {
        throw new errors_1.BuildError(`tsconfig: ${tsConfigFile.error.messageText}`);
    }
    else if (!tsConfigFile.config) {
        throw new errors_1.BuildError(`tsconfig: invalid config, "${tsConfigPath}""`);
    }
    else {
        const parsedConfig = ts.parseJsonConfigFileContent(tsConfigFile.config, ts.sys, context.rootDir, {}, tsConfigPath);
        const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, parsedConfig.errors);
        if (diagnostics.length) {
            logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, true, true);
            throw new errors_1.BuildError(`tsconfig: invalid config, "${tsConfigPath}""`);
        }
        config = {
            options: parsedConfig.options,
            fileNames: parsedConfig.fileNames,
            raw: parsedConfig.raw
        };
    }
    return config;
}
exports.getTsConfig = getTsConfig;
function transpileTsString(context, filePath, stringToTranspile) {
    if (!cachedTsConfig) {
        cachedTsConfig = getTsConfig(context);
    }
    const transpileOptions = {
        compilerOptions: cachedTsConfig.options,
        fileName: filePath,
        reportDiagnostics: true,
    };
    transpileOptions.compilerOptions.allowJs = true;
    transpileOptions.compilerOptions.sourceMap = true;
    // transpile this one module
    return ts.transpileModule(stringToTranspile, transpileOptions);
}
exports.transpileTsString = transpileTsString;
function transformSource(filePath, input) {
    if (util_1.isDeepLinkingFile(filePath)) {
        input = util_1.purgeDeepLinkDecorator(input);
    }
    else if (filePath === helpers_1.getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH) && !util_1.hasExistingDeepLinkConfig(filePath, input)) {
        const deepLinkString = util_1.convertDeepLinkConfigEntriesToString(helpers_1.getParsedDeepLinkConfig());
        input = util_1.getUpdatedAppNgModuleContentWithDeepLinkConfig(filePath, input, deepLinkString);
    }
    return input;
}
exports.transformSource = transformSource;
function copyOriginalSourceFiles(fileCache) {
    const deepLinkFiles = util_1.filterTypescriptFilesForDeepLinks(fileCache);
    const appNgModule = fileCache.get(helpers_1.getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH));
    deepLinkFiles.push(appNgModule);
    deepLinkFiles.forEach(deepLinkFile => {
        fileCache.set(deepLinkFile.path + exports.inMemoryFileCopySuffix, {
            path: deepLinkFile.path + exports.inMemoryFileCopySuffix,
            content: deepLinkFile.content
        });
    });
}
exports.copyOriginalSourceFiles = copyOriginalSourceFiles;
function resetSourceFiles(fileCache) {
    fileCache.getAll().forEach(file => {
        if (path.extname(file.path) === `.ts${exports.inMemoryFileCopySuffix}`) {
            const originalExtension = helpers_1.changeExtension(file.path, '.ts');
            fileCache.set(originalExtension, {
                path: originalExtension,
                content: file.content
            });
            fileCache.getRawStore().delete(file.path);
        }
    });
}
exports.resetSourceFiles = resetSourceFiles;
exports.inMemoryFileCopySuffix = 'original';
let cachedProgram = null;
let cachedTsConfig = null;
function getTsConfigPath(context) {
    return process.env[Constants.ENV_TS_CONFIG];
}
exports.getTsConfigPath = getTsConfigPath;
