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
exports.runNg5Aot = exports.runNg4Aot = exports.isNg5 = exports.transpileFiles = exports.isTranspileRequired = exports.runAot = void 0;
const path_1 = require("path");
require("reflect-metadata");
const typescript_1 = require("typescript");
const hybrid_file_system_factory_1 = require("../util/hybrid-file-system-factory");
const compiler_host_factory_1 = require("./compiler-host-factory");
const utils_1 = require("./utils");
const logger_1 = require("../logger/logger");
const logger_diagnostics_1 = require("../logger/logger-diagnostics");
const logger_typescript_1 = require("../logger/logger-typescript");
const transpile_1 = require("../transpile");
const errors_1 = require("../util/errors");
const helpers_1 = require("../util/helpers");
function runAot(context, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const tsConfig = transpile_1.getTsConfig(context);
        const angularCompilerOptions = Object.assign({}, {
            basePath: options.rootDir,
            genDir: options.rootDir,
            entryPoint: options.entryPoint
        });
        const aggregateCompilerOption = Object.assign(tsConfig.options, angularCompilerOptions);
        const fileSystem = hybrid_file_system_factory_1.getInstance(false);
        const compilerHost = compiler_host_factory_1.getFileSystemCompilerHostInstance(tsConfig.options);
        // todo, consider refactoring at some point
        const tsProgram = typescript_1.createProgram(tsConfig.fileNames, tsConfig.options, compilerHost);
        logger_diagnostics_1.clearDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript);
        if (isNg5(context.angularVersion)) {
            yield runNg5Aot(context, tsConfig, aggregateCompilerOption, compilerHost);
        }
        else {
            yield runNg4Aot({
                angularCompilerOptions: aggregateCompilerOption,
                cliOptions: {
                    i18nFile: undefined,
                    i18nFormat: undefined,
                    locale: undefined,
                    basePath: options.rootDir,
                    missingTranslation: null
                },
                program: tsProgram,
                compilerHost: compilerHost,
                compilerOptions: tsConfig.options
            });
        }
        errorCheckProgram(context, tsConfig, compilerHost, tsProgram);
        // update bootstrap in main.ts
        const mailFilePath = isNg5(context.angularVersion) ? helpers_1.changeExtension(options.entryPoint, '.js') : options.entryPoint;
        const mainFile = context.fileCache.get(mailFilePath);
        const modifiedBootstrapContent = replaceBootstrap(mainFile, options.appNgModulePath, options.appNgModuleClass, options);
        mainFile.content = modifiedBootstrapContent;
        if (isTranspileRequired(context.angularVersion)) {
            transpileFiles(context, tsConfig, fileSystem);
        }
    });
}
exports.runAot = runAot;
function errorCheckProgram(context, tsConfig, compilerHost, cachedProgram) {
    // Create a new Program, based on the old one. This will trigger a resolution of all
    // transitive modules, which include files that might just have been generated.
    const program = typescript_1.createProgram(tsConfig.fileNames, tsConfig.options, compilerHost, cachedProgram);
    const globalDiagnostics = program.getGlobalDiagnostics();
    const tsDiagnostics = program.getSyntacticDiagnostics()
        .concat(program.getSemanticDiagnostics())
        .concat(program.getOptionsDiagnostics());
    if (globalDiagnostics.length) {
        const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, globalDiagnostics);
        logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, true, false);
        throw new errors_1.BuildError(new Error('Failed to transpile TypeScript'));
    }
    if (tsDiagnostics.length) {
        const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, tsDiagnostics);
        logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, true, false);
        throw new errors_1.BuildError(new Error('Failed to transpile TypeScript'));
    }
    return program;
}
function replaceBootstrap(mainFile, appNgModulePath, appNgModuleClass, options) {
    if (!mainFile) {
        throw new errors_1.BuildError(new Error(`Could not find entry point (bootstrap file) ${options.entryPoint}`));
    }
    let modifiedFileContent = null;
    try {
        logger_1.Logger.debug('[AotCompiler] compile: Dynamically changing entry point content to AOT mode content');
        modifiedFileContent = utils_1.replaceBootstrapImpl(mainFile.path, mainFile.content, appNgModulePath, appNgModuleClass);
    }
    catch (ex) {
        logger_1.Logger.debug(`Failed to parse bootstrap: `, ex.message);
        logger_1.Logger.warn(`Failed to parse and update ${options.entryPoint} content for AoT compilation.
                For now, the default fallback content will be used instead.
                Please consider updating ${options.entryPoint} with the content from the following link:
                https://github.com/ionic-team/ionic2-app-base/tree/master/src/app/main.ts`);
        modifiedFileContent = utils_1.getFallbackMainContent();
    }
    return modifiedFileContent;
}
function isTranspileRequired(angularVersion) {
    return angularVersion.major <= 4;
}
exports.isTranspileRequired = isTranspileRequired;
function transpileFiles(context, tsConfig, fileSystem) {
    const tsFiles = context.fileCache.getAll().filter(file => path_1.extname(file.path) === '.ts' && file.path.indexOf('.d.ts') === -1);
    for (const tsFile of tsFiles) {
        logger_1.Logger.debug(`[AotCompiler] transpileFiles: Transpiling file ${tsFile.path} ...`);
        const transpileOutput = transpileFileContent(tsFile.path, tsFile.content, tsConfig.options);
        const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, transpileOutput.diagnostics);
        if (diagnostics.length) {
            // darn, we've got some things wrong, transpile failed :(
            logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, true, true);
            throw new errors_1.BuildError(new Error('Failed to transpile TypeScript'));
        }
        const jsFilePath = helpers_1.changeExtension(tsFile.path, '.js');
        fileSystem.addVirtualFile(jsFilePath, transpileOutput.outputText);
        fileSystem.addVirtualFile(jsFilePath + '.map', transpileOutput.sourceMapText);
        logger_1.Logger.debug(`[AotCompiler] transpileFiles: Transpiling file ${tsFile.path} ... DONE`);
    }
}
exports.transpileFiles = transpileFiles;
function transpileFileContent(fileName, sourceText, options) {
    const transpileOptions = {
        compilerOptions: options,
        fileName: fileName,
        reportDiagnostics: true
    };
    return typescript_1.transpileModule(sourceText, transpileOptions);
}
function isNg5(version) {
    return version.major >= 5;
}
exports.isNg5 = isNg5;
function runNg4Aot(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const module = yield Promise.resolve().then(() => require('@angular/compiler-cli'));
        return yield module.__NGTOOLS_PRIVATE_API_2.codeGen({
            angularCompilerOptions: options.angularCompilerOptions,
            basePath: options.cliOptions.basePath,
            program: options.program,
            host: options.compilerHost,
            compilerOptions: options.compilerOptions,
            i18nFile: options.cliOptions.i18nFile,
            i18nFormat: options.cliOptions.i18nFormat,
            locale: options.cliOptions.locale,
            readResource: (fileName) => {
                return helpers_1.readFileAsync(fileName);
            }
        });
    });
}
exports.runNg4Aot = runNg4Aot;
function runNg5Aot(context, tsConfig, aggregateCompilerOptions, compilerHost) {
    return __awaiter(this, void 0, void 0, function* () {
        const ngTools2 = yield Promise.resolve().then(() => require('@angular/compiler-cli/ngtools2'));
        const angularCompilerHost = ngTools2.createCompilerHost({ options: aggregateCompilerOptions, tsHost: compilerHost });
        const program = ngTools2.createProgram({
            rootNames: tsConfig.fileNames,
            options: aggregateCompilerOptions,
            host: angularCompilerHost,
            oldProgram: null
        });
        yield program.loadNgStructureAsync();
        const transformations = [];
        const transformers = {
            beforeTs: transformations
        };
        const result = program.emit({ emitFlags: ngTools2.EmitFlags.Default, customTransformers: transformers });
        const tsDiagnostics = program.getTsSyntacticDiagnostics()
            .concat(program.getTsOptionDiagnostics())
            .concat(program.getTsSemanticDiagnostics());
        const angularDiagnostics = program.getNgStructuralDiagnostics()
            .concat(program.getNgOptionDiagnostics());
        if (tsDiagnostics.length) {
            const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, tsDiagnostics);
            logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, true, false);
            throw new errors_1.BuildError(new Error('The Angular AoT build failed. See the issues above'));
        }
        if (angularDiagnostics.length) {
            const diagnostics = logger_typescript_1.runTypeScriptDiagnostics(context, angularDiagnostics);
            logger_diagnostics_1.printDiagnostics(context, logger_diagnostics_1.DiagnosticsType.TypeScript, diagnostics, true, false);
            throw new errors_1.BuildError(new Error('The Angular AoT build failed. See the issues above'));
        }
    });
}
exports.runNg5Aot = runNg5Aot;
