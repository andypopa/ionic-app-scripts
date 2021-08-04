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
exports.createPageConstants = exports.createConstStatments = exports.generateTemplates = exports.tabsModuleManipulation = exports.nonPageFileManipulation = exports.getDirToWriteToByType = exports.getNgModules = exports.writeGeneratedFiles = exports.applyTemplates = exports.filterOutTemplates = exports.readTemplates = exports.hydrateTabRequest = exports.createCommonModule = exports.hydrateRequest = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const logger_1 = require("../logger/logger");
const helpers_1 = require("../util/helpers");
const Constants = require("../util/constants");
const GeneratorConstants = require("./constants");
const helpers_2 = require("../util/helpers");
const glob_util_1 = require("../util/glob-util");
const helpers_3 = require("../util/helpers");
const typescript_utils_1 = require("../util/typescript-utils");
function hydrateRequest(context, request) {
    const hydrated = request;
    const suffix = getSuffixFromGeneratorType(context, request.type);
    hydrated.className = helpers_3.ensureSuffix(helpers_2.pascalCase(request.name), helpers_2.upperCaseFirst(suffix));
    hydrated.fileName = helpers_3.removeSuffix(helpers_2.paramCase(request.name), `-${helpers_2.paramCase(suffix)}`);
    if (request.type === 'pipe')
        hydrated.pipeName = helpers_2.camelCase(request.name);
    if (!!hydrated.includeNgModule) {
        if (hydrated.type === 'tabs') {
            hydrated.importStatement = `import { IonicPage, NavController } from 'ionic-angular';`;
        }
        else {
            hydrated.importStatement = `import { IonicPage, NavController, NavParams } from 'ionic-angular';`;
        }
        hydrated.ionicPage = '\n@IonicPage()';
    }
    else {
        hydrated.ionicPage = null;
        hydrated.importStatement = `import { NavController, NavParams } from 'ionic-angular';`;
    }
    hydrated.dirToRead = path_1.join(helpers_2.getStringPropertyValue(Constants.ENV_VAR_IONIC_ANGULAR_TEMPLATE_DIR), request.type);
    const baseDir = getDirToWriteToByType(context, request.type);
    hydrated.dirToWrite = path_1.join(baseDir, hydrated.fileName);
    return hydrated;
}
exports.hydrateRequest = hydrateRequest;
function createCommonModule(envVar, requestType) {
    let className = requestType.charAt(0).toUpperCase() + requestType.slice(1) + 's';
    let tmplt = `import { NgModule } from '@angular/core';\n@NgModule({\n\tdeclarations: [],\n\timports: [],\n\texports: []\n})\nexport class ${className}Module {}\n`;
    fs_1.writeFileSync(envVar, tmplt);
}
exports.createCommonModule = createCommonModule;
function hydrateTabRequest(context, request) {
    const h = hydrateRequest(context, request);
    const hydrated = Object.assign({
        tabs: request.tabs,
        tabContent: '',
        tabVariables: '',
        tabsImportStatement: '',
    }, h);
    if (hydrated.includeNgModule) {
        hydrated.tabsImportStatement += `import { IonicPage, NavController } from 'ionic-angular';`;
    }
    else {
        hydrated.tabsImportStatement += `import { NavController } from 'ionic-angular';`;
    }
    for (let i = 0; i < request.tabs.length; i++) {
        const tabVar = `${helpers_2.camelCase(request.tabs[i].name)}Root`;
        if (hydrated.includeNgModule) {
            hydrated.tabVariables += `  ${tabVar} = '${request.tabs[i].className}'\n`;
        }
        else {
            hydrated.tabVariables += `  ${tabVar} = ${request.tabs[i].className}\n`;
        }
        // If this is the last ion-tab to insert
        // then we do not want a new line
        if (i === request.tabs.length - 1) {
            hydrated.tabContent += `    <ion-tab [root]="${tabVar}" tabTitle="${helpers_2.sentenceCase(request.tabs[i].name)}" tabIcon="information-circle"></ion-tab>`;
        }
        else {
            hydrated.tabContent += `    <ion-tab [root]="${tabVar}" tabTitle="${helpers_2.sentenceCase(request.tabs[i].name)}" tabIcon="information-circle"></ion-tab>\n`;
        }
    }
    return hydrated;
}
exports.hydrateTabRequest = hydrateTabRequest;
function readTemplates(pathToRead) {
    const fileNames = fs_1.readdirSync(pathToRead);
    const absolutePaths = fileNames.map(fileName => {
        return path_1.join(pathToRead, fileName);
    });
    const filePathToContent = new Map();
    const promises = absolutePaths.map(absolutePath => {
        const promise = helpers_2.readFileAsync(absolutePath);
        promise.then((fileContent) => {
            filePathToContent.set(absolutePath, fileContent);
        });
        return promise;
    });
    return Promise.all(promises).then(() => {
        return filePathToContent;
    });
}
exports.readTemplates = readTemplates;
function filterOutTemplates(request, templates) {
    const templatesToUseMap = new Map();
    templates.forEach((fileContent, filePath) => {
        const newFileExtension = path_1.basename(filePath, GeneratorConstants.KNOWN_FILE_EXTENSION);
        const shouldSkip = (!request.includeNgModule && newFileExtension === GeneratorConstants.NG_MODULE_FILE_EXTENSION) || (!request.includeSpec && newFileExtension === GeneratorConstants.SPEC_FILE_EXTENSION);
        if (!shouldSkip) {
            templatesToUseMap.set(filePath, fileContent);
        }
    });
    return templatesToUseMap;
}
exports.filterOutTemplates = filterOutTemplates;
function applyTemplates(request, templates) {
    const appliedTemplateMap = new Map();
    templates.forEach((fileContent, filePath) => {
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.CLASSNAME_VARIABLE, request.className);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.PIPENAME_VARIABLE, request.pipeName);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.IMPORTSTATEMENT_VARIABLE, request.importStatement);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.IONICPAGE_VARIABLE, request.ionicPage);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.FILENAME_VARIABLE, request.fileName);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.SUPPLIEDNAME_VARIABLE, request.name);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.TAB_CONTENT_VARIABLE, request.tabContent);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.TAB_VARIABLES_VARIABLE, request.tabVariables);
        fileContent = helpers_2.replaceAll(fileContent, GeneratorConstants.TABS_IMPORTSTATEMENT_VARIABLE, request.tabsImportStatement);
        appliedTemplateMap.set(filePath, fileContent);
    });
    return appliedTemplateMap;
}
exports.applyTemplates = applyTemplates;
function writeGeneratedFiles(request, processedTemplates) {
    const promises = [];
    const createdFileList = [];
    processedTemplates.forEach((fileContent, filePath) => {
        const newFileExtension = path_1.basename(filePath, GeneratorConstants.KNOWN_FILE_EXTENSION);
        const newFileName = `${request.fileName}.${newFileExtension}`;
        const fileToWrite = path_1.join(request.dirToWrite, newFileName);
        createdFileList.push(fileToWrite);
        promises.push(createDirAndWriteFile(fileToWrite, fileContent));
    });
    return Promise.all(promises).then(() => {
        return createdFileList;
    });
}
exports.writeGeneratedFiles = writeGeneratedFiles;
function createDirAndWriteFile(filePath, fileContent) {
    const directory = path_1.dirname(filePath);
    return helpers_2.mkDirpAsync(directory).then(() => {
        return helpers_2.writeFileAsync(filePath, fileContent);
    });
}
function getNgModules(context, types) {
    const ngModuleSuffix = helpers_2.getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX);
    const patterns = types.map((type) => path_1.join(getDirToWriteToByType(context, type), '**', `*${ngModuleSuffix}`));
    return glob_util_1.globAll(patterns);
}
exports.getNgModules = getNgModules;
function getSuffixFromGeneratorType(context, type) {
    if (type === Constants.COMPONENT) {
        return 'Component';
    }
    else if (type === Constants.DIRECTIVE) {
        return 'Directive';
    }
    else if (type === Constants.PAGE || type === Constants.TABS) {
        return 'Page';
    }
    else if (type === Constants.PIPE) {
        return 'Pipe';
    }
    else if (type === Constants.PROVIDER) {
        return 'Provider';
    }
    throw new Error(`Unknown Generator Type: ${type}`);
}
function getDirToWriteToByType(context, type) {
    if (type === Constants.COMPONENT) {
        return context.componentsDir;
    }
    else if (type === Constants.DIRECTIVE) {
        return context.directivesDir;
    }
    else if (type === Constants.PAGE || type === Constants.TABS) {
        return context.pagesDir;
    }
    else if (type === Constants.PIPE) {
        return context.pipesDir;
    }
    else if (type === Constants.PROVIDER) {
        return context.providersDir;
    }
    throw new Error(`Unknown Generator Type: ${type}`);
}
exports.getDirToWriteToByType = getDirToWriteToByType;
function nonPageFileManipulation(context, name, ngModulePath, type) {
    return __awaiter(this, void 0, void 0, function* () {
        const hydratedRequest = hydrateRequest(context, { type, name });
        const envVar = helpers_2.getStringPropertyValue(`IONIC_${hydratedRequest.type.toUpperCase()}S_NG_MODULE_PATH`);
        let importPath;
        let fileContent;
        let templatesArray = yield generateTemplates(context, hydratedRequest, false);
        if (hydratedRequest.type === 'pipe' || hydratedRequest.type === 'component' || hydratedRequest.type === 'directive') {
            if (!fs_1.existsSync(envVar))
                createCommonModule(envVar, hydratedRequest.type);
        }
        const typescriptFilePath = helpers_3.changeExtension(templatesArray.filter(path => path_1.extname(path) === '.ts')[0], '');
        helpers_2.readFileAsync(ngModulePath).then((content) => {
            importPath = type === 'pipe' || type === 'component' || type === 'directive'
                // Insert `./` if it's a pipe component or directive
                // Since these will go in a common module.
                ? helpers_1.toUnixPath(`./${path_1.relative(path_1.dirname(ngModulePath), hydratedRequest.dirToWrite)}${path_1.sep}${hydratedRequest.fileName}`)
                : helpers_1.toUnixPath(`${path_1.relative(path_1.dirname(ngModulePath), hydratedRequest.dirToWrite)}${path_1.sep}${hydratedRequest.fileName}`);
            content = typescript_utils_1.insertNamedImportIfNeeded(ngModulePath, content, hydratedRequest.className, importPath);
            if (type === 'pipe' || type === 'component' || type === 'directive') {
                content = typescript_utils_1.appendNgModuleDeclaration(ngModulePath, content, hydratedRequest.className);
                content = typescript_utils_1.appendNgModuleExports(ngModulePath, content, hydratedRequest.className);
            }
            if (type === 'provider') {
                content = typescript_utils_1.appendNgModuleProvider(ngModulePath, content, hydratedRequest.className);
            }
            return helpers_2.writeFileAsync(ngModulePath, content);
        });
    });
}
exports.nonPageFileManipulation = nonPageFileManipulation;
function tabsModuleManipulation(tabs, hydratedRequest, tabHydratedRequests) {
    tabHydratedRequests.forEach((tabRequest, index) => {
        tabRequest.generatedFileNames = tabs[index];
    });
    const ngModulePath = tabs[0].find((element) => element.indexOf('module') !== -1);
    if (!ngModulePath) {
        // Static imports
        const tabsPath = path_1.join(hydratedRequest.dirToWrite, `${hydratedRequest.fileName}.ts`);
        let modifiedContent = null;
        return helpers_2.readFileAsync(tabsPath).then(content => {
            tabHydratedRequests.forEach((tabRequest) => {
                const typescriptFilePath = helpers_3.changeExtension(tabRequest.generatedFileNames.filter(path => path_1.extname(path) === '.ts')[0], '');
                const importPath = helpers_1.toUnixPath(path_1.relative(path_1.dirname(tabsPath), typescriptFilePath));
                modifiedContent = typescript_utils_1.insertNamedImportIfNeeded(tabsPath, content, tabRequest.className, importPath);
                content = modifiedContent;
            });
            return helpers_2.writeFileAsync(tabsPath, modifiedContent);
        });
    }
}
exports.tabsModuleManipulation = tabsModuleManipulation;
function generateTemplates(context, request, includePageConstants) {
    logger_1.Logger.debug('[Generators] generateTemplates: Reading templates ...');
    let pageConstantFile = path_1.join(context.pagesDir, 'pages.constants.ts');
    if (includePageConstants && !fs_1.existsSync(pageConstantFile))
        createPageConstants(context);
    return readTemplates(request.dirToRead).then((map) => {
        logger_1.Logger.debug('[Generators] generateTemplates: Filtering out NgModule and Specs if needed ...');
        return filterOutTemplates(request, map);
    }).then((filteredMap) => {
        logger_1.Logger.debug('[Generators] generateTemplates: Applying templates ...');
        const appliedTemplateMap = applyTemplates(request, filteredMap);
        logger_1.Logger.debug('[Generators] generateTemplates: Writing generated files to disk ...');
        // Adding const to gets some type completion
        if (includePageConstants)
            createConstStatments(pageConstantFile, request);
        return writeGeneratedFiles(request, appliedTemplateMap);
    });
}
exports.generateTemplates = generateTemplates;
function createConstStatments(pageConstantFile, request) {
    helpers_2.readFileAsync(pageConstantFile).then((content) => {
        content += `\nexport const ${helpers_2.constantCase(request.className)} = '${request.className}';`;
        helpers_2.writeFileAsync(pageConstantFile, content);
    });
}
exports.createConstStatments = createConstStatments;
function createPageConstants(context) {
    let pageConstantFile = path_1.join(context.pagesDir, 'pages.constants.ts');
    helpers_2.writeFileAsync(pageConstantFile, '//Constants for getting type references');
}
exports.createPageConstants = createPageConstants;
