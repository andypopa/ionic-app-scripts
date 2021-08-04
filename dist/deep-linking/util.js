"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectDeepLinkConfigTypescriptTransform = exports.getInjectDeepLinkConfigTypescriptTransform = exports.purgeDeepLinkImport = exports.purgeDeepLinkDecorator = exports.purgeDeepLinkDecoratorTSTransformImpl = exports.purgeDeepLinkDecoratorTSTransform = exports.generateDefaultDeepLinkNgModuleContent = exports.addDeepLinkArgumentToAppNgModule = exports.addDefaultSecondArgumentToAppNgModule = exports.getUpdatedAppNgModuleFactoryContentWithDeepLinksConfig = exports.getUpdatedAppNgModuleContentWithDeepLinkConfig = exports.updateAppNgModuleWithDeepLinkConfig = exports.convertDeepLinkEntryToJsObjectString = exports.convertDeepLinkConfigEntriesToString = exports.hasExistingDeepLinkConfig = exports.getDeepLinkDecoratorContentForSourceFile = exports.getNgModuleDataFromPage = exports.getRelativePathToPageNgModuleFromAppNgModule = exports.getNgModulePathFromCorrespondingPage = exports.isDeepLinkingFile = exports.filterTypescriptFilesForDeepLinks = exports.getDeepLinkData = void 0;
const path_1 = require("path");
const typescript_1 = require("typescript");
const logger_1 = require("../logger/logger");
const Constants = require("../util/constants");
const helpers_1 = require("../util/helpers");
const typescript_utils_1 = require("../util/typescript-utils");
function getDeepLinkData(appNgModuleFilePath, fileCache, isAot) {
    // we only care about analyzing a subset of typescript files, so do that for efficiency
    const typescriptFiles = filterTypescriptFilesForDeepLinks(fileCache);
    const deepLinkConfigEntries = new Map();
    const segmentSet = new Set();
    typescriptFiles.forEach(file => {
        const sourceFile = typescript_utils_1.getTypescriptSourceFile(file.path, file.content);
        const deepLinkDecoratorData = getDeepLinkDecoratorContentForSourceFile(sourceFile);
        if (deepLinkDecoratorData) {
            // sweet, the page has a DeepLinkDecorator, which means it meets the criteria to process that bad boy
            const pathInfo = getNgModuleDataFromPage(appNgModuleFilePath, file.path, deepLinkDecoratorData.className, fileCache, isAot);
            const deepLinkConfigEntry = Object.assign({}, deepLinkDecoratorData, pathInfo);
            if (deepLinkConfigEntries.has(deepLinkConfigEntry.name)) {
                // gadzooks, it's a duplicate name
                throw new Error(`There are multiple entries in the deeplink config with the name of ${deepLinkConfigEntry.name}`);
            }
            if (segmentSet.has(deepLinkConfigEntry.segment)) {
                // gadzooks, it's a duplicate segment
                throw new Error(`There are multiple entries in the deeplink config with the segment of ${deepLinkConfigEntry.segment}`);
            }
            segmentSet.add(deepLinkConfigEntry.segment);
            deepLinkConfigEntries.set(deepLinkConfigEntry.name, deepLinkConfigEntry);
        }
    });
    return deepLinkConfigEntries;
}
exports.getDeepLinkData = getDeepLinkData;
function filterTypescriptFilesForDeepLinks(fileCache) {
    return fileCache.getAll().filter(file => isDeepLinkingFile(file.path));
}
exports.filterTypescriptFilesForDeepLinks = filterTypescriptFilesForDeepLinks;
function isDeepLinkingFile(filePath) {
    const deepLinksDir = helpers_1.getStringPropertyValue(Constants.ENV_VAR_DEEPLINKS_DIR) + path_1.sep;
    const moduleSuffix = helpers_1.getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX);
    const result = path_1.extname(filePath) === '.ts' && filePath.indexOf(moduleSuffix) === -1 && filePath.indexOf(deepLinksDir) >= 0;
    return result;
}
exports.isDeepLinkingFile = isDeepLinkingFile;
function getNgModulePathFromCorrespondingPage(filePath) {
    const newExtension = helpers_1.getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX);
    return helpers_1.changeExtension(filePath, newExtension);
}
exports.getNgModulePathFromCorrespondingPage = getNgModulePathFromCorrespondingPage;
function getRelativePathToPageNgModuleFromAppNgModule(pathToAppNgModule, pathToPageNgModule) {
    return path_1.relative(path_1.dirname(pathToAppNgModule), pathToPageNgModule);
}
exports.getRelativePathToPageNgModuleFromAppNgModule = getRelativePathToPageNgModuleFromAppNgModule;
function getNgModuleDataFromPage(appNgModuleFilePath, filePath, className, fileCache, isAot) {
    const ngModulePath = getNgModulePathFromCorrespondingPage(filePath);
    let ngModuleFile = fileCache.get(ngModulePath);
    if (!ngModuleFile) {
        throw new Error(`${filePath} has a @IonicPage decorator, but it does not have a corresponding "NgModule" at ${ngModulePath}`);
    }
    // get the class declaration out of NgModule class content
    const exportedClassName = typescript_utils_1.getNgModuleClassName(ngModuleFile.path, ngModuleFile.content);
    const relativePathToAppNgModule = getRelativePathToPageNgModuleFromAppNgModule(appNgModuleFilePath, ngModulePath);
    const absolutePath = isAot ? helpers_1.changeExtension(ngModulePath, '.ngfactory.js') : helpers_1.changeExtension(ngModulePath, '.ts');
    const userlandModulePath = isAot ? helpers_1.changeExtension(relativePathToAppNgModule, '.ngfactory') : helpers_1.changeExtension(relativePathToAppNgModule, '');
    const namedExport = isAot ? `${exportedClassName}NgFactory` : exportedClassName;
    return {
        absolutePath: absolutePath,
        userlandModulePath: helpers_1.toUnixPath(userlandModulePath),
        className: namedExport
    };
}
exports.getNgModuleDataFromPage = getNgModuleDataFromPage;
function getDeepLinkDecoratorContentForSourceFile(sourceFile) {
    const classDeclarations = typescript_utils_1.getClassDeclarations(sourceFile);
    const defaultSegment = path_1.basename(helpers_1.changeExtension(sourceFile.fileName, ''));
    const list = [];
    classDeclarations.forEach(classDeclaration => {
        if (classDeclaration.decorators) {
            classDeclaration.decorators.forEach(decorator => {
                const className = classDeclaration.name.text;
                if (decorator.expression && decorator.expression.expression && decorator.expression.expression.text === DEEPLINK_DECORATOR_TEXT) {
                    const deepLinkArgs = decorator.expression.arguments;
                    let deepLinkObject = null;
                    if (deepLinkArgs && deepLinkArgs.length) {
                        deepLinkObject = deepLinkArgs[0];
                    }
                    let propertyList = [];
                    if (deepLinkObject && deepLinkObject.properties) {
                        propertyList = deepLinkObject.properties; // TODO this typing got jacked up
                    }
                    const deepLinkName = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, className, DEEPLINK_DECORATOR_NAME_ATTRIBUTE);
                    const deepLinkSegment = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, defaultSegment, DEEPLINK_DECORATOR_SEGMENT_ATTRIBUTE);
                    const deepLinkPriority = getStringValueFromDeepLinkDecorator(sourceFile, propertyList, 'low', DEEPLINK_DECORATOR_PRIORITY_ATTRIBUTE);
                    const deepLinkDefaultHistory = getArrayValueFromDeepLinkDecorator(sourceFile, propertyList, [], DEEPLINK_DECORATOR_DEFAULT_HISTORY_ATTRIBUTE);
                    const rawStringContent = typescript_utils_1.getNodeStringContent(sourceFile, decorator.expression);
                    list.push({
                        name: deepLinkName,
                        segment: deepLinkSegment,
                        priority: deepLinkPriority,
                        defaultHistory: deepLinkDefaultHistory,
                        rawString: rawStringContent,
                        className: className
                    });
                }
            });
        }
    });
    if (list.length > 1) {
        throw new Error('Only one @IonicPage decorator is allowed per file.');
    }
    if (list.length === 1) {
        return list[0];
    }
    return null;
}
exports.getDeepLinkDecoratorContentForSourceFile = getDeepLinkDecoratorContentForSourceFile;
function getStringValueFromDeepLinkDecorator(sourceFile, propertyNodeList, defaultValue, identifierToLookFor) {
    try {
        let valueToReturn = defaultValue;
        logger_1.Logger.debug(`[DeepLinking util] getNameValueFromDeepLinkDecorator: Setting default deep link ${identifierToLookFor} to ${defaultValue}`);
        propertyNodeList.forEach(propertyNode => {
            if (propertyNode && propertyNode.name && propertyNode.name.text === identifierToLookFor) {
                const initializer = propertyNode.initializer;
                let stringContent = typescript_utils_1.getNodeStringContent(sourceFile, initializer);
                stringContent = helpers_1.replaceAll(stringContent, '\'', '');
                stringContent = helpers_1.replaceAll(stringContent, '`', '');
                stringContent = helpers_1.replaceAll(stringContent, '"', '');
                stringContent = stringContent.trim();
                valueToReturn = stringContent;
            }
        });
        logger_1.Logger.debug(`[DeepLinking util] getNameValueFromDeepLinkDecorator: DeepLink ${identifierToLookFor} set to ${valueToReturn}`);
        return valueToReturn;
    }
    catch (ex) {
        logger_1.Logger.error(`Failed to parse the @IonicPage decorator. The ${identifierToLookFor} must be an array of strings`);
        throw ex;
    }
}
function getArrayValueFromDeepLinkDecorator(sourceFile, propertyNodeList, defaultValue, identifierToLookFor) {
    try {
        let valueToReturn = defaultValue;
        logger_1.Logger.debug(`[DeepLinking util] getArrayValueFromDeepLinkDecorator: Setting default deep link ${identifierToLookFor} to ${defaultValue}`);
        propertyNodeList.forEach(propertyNode => {
            if (propertyNode && propertyNode.name && propertyNode.name.text === identifierToLookFor) {
                const initializer = propertyNode.initializer;
                if (initializer && initializer.elements) {
                    const stringArray = initializer.elements.map((element) => {
                        let elementText = element.text;
                        elementText = helpers_1.replaceAll(elementText, '\'', '');
                        elementText = helpers_1.replaceAll(elementText, '`', '');
                        elementText = helpers_1.replaceAll(elementText, '"', '');
                        elementText = elementText.trim();
                        return elementText;
                    });
                    valueToReturn = stringArray;
                }
            }
        });
        logger_1.Logger.debug(`[DeepLinking util] getNameValueFromDeepLinkDecorator: DeepLink ${identifierToLookFor} set to ${valueToReturn}`);
        return valueToReturn;
    }
    catch (ex) {
        logger_1.Logger.error(`Failed to parse the @IonicPage decorator. The ${identifierToLookFor} must be an array of strings`);
        throw ex;
    }
}
function hasExistingDeepLinkConfig(appNgModuleFilePath, appNgModuleFileContent) {
    const sourceFile = typescript_utils_1.getTypescriptSourceFile(appNgModuleFilePath, appNgModuleFileContent);
    const decorator = typescript_utils_1.getNgModuleDecorator(appNgModuleFilePath, sourceFile);
    const functionCall = getIonicModuleForRootCall(decorator);
    if (functionCall.arguments.length <= 2) {
        return false;
    }
    const deepLinkConfigArg = functionCall.arguments[2];
    if (deepLinkConfigArg.kind === typescript_1.SyntaxKind.NullKeyword || deepLinkConfigArg.kind === typescript_1.SyntaxKind.UndefinedKeyword) {
        return false;
    }
    if (deepLinkConfigArg.kind === typescript_1.SyntaxKind.ObjectLiteralExpression) {
        return true;
    }
    if (deepLinkConfigArg.text && deepLinkConfigArg.text.length > 0) {
        return true;
    }
}
exports.hasExistingDeepLinkConfig = hasExistingDeepLinkConfig;
function getIonicModuleForRootCall(decorator) {
    const argument = typescript_utils_1.getNgModuleObjectLiteralArg(decorator);
    const properties = argument.properties.filter((property) => {
        return property.name.text === NG_MODULE_IMPORT_DECLARATION;
    });
    if (properties.length === 0) {
        throw new Error('Could not find "import" property in NgModule arguments');
    }
    if (properties.length > 1) {
        throw new Error('Found multiple "import" properties in NgModule arguments. Only one is allowed');
    }
    const property = properties[0];
    const importArrayLiteral = property.initializer;
    const functionsInImport = importArrayLiteral.elements.filter(element => {
        return element.kind === typescript_1.SyntaxKind.CallExpression;
    });
    const ionicModuleFunctionCalls = functionsInImport.filter((functionNode) => {
        return (functionNode.expression
            && functionNode.expression.name
            && functionNode.expression.name.text === FOR_ROOT_METHOD
            && functionNode.expression.expression
            && functionNode.expression.expression.text === IONIC_MODULE_NAME);
    });
    if (ionicModuleFunctionCalls.length === 0) {
        throw new Error('Could not find IonicModule.forRoot call in "imports"');
    }
    if (ionicModuleFunctionCalls.length > 1) {
        throw new Error('Found multiple IonicModule.forRoot calls in "imports". Only one is allowed');
    }
    return ionicModuleFunctionCalls[0];
}
function convertDeepLinkConfigEntriesToString(entries) {
    const individualLinks = [];
    entries.forEach(entry => {
        individualLinks.push(convertDeepLinkEntryToJsObjectString(entry));
    });
    const deepLinkConfigString = `
{
  links: [
    ${individualLinks.join(',\n    ')}
  ]
}`;
    return deepLinkConfigString;
}
exports.convertDeepLinkConfigEntriesToString = convertDeepLinkConfigEntriesToString;
function convertDeepLinkEntryToJsObjectString(entry) {
    const defaultHistoryWithQuotes = entry.defaultHistory.map(defaultHistoryEntry => `'${defaultHistoryEntry}'`);
    const segmentString = entry.segment && entry.segment.length ? `'${entry.segment}'` : null;
    return `{ loadChildren: '${entry.userlandModulePath}${LOAD_CHILDREN_SEPARATOR}${entry.className}', name: '${entry.name}', segment: ${segmentString}, priority: '${entry.priority}', defaultHistory: [${defaultHistoryWithQuotes.join(', ')}] }`;
}
exports.convertDeepLinkEntryToJsObjectString = convertDeepLinkEntryToJsObjectString;
function updateAppNgModuleWithDeepLinkConfig(context, deepLinkString, changedFiles) {
    const appNgModulePath = helpers_1.getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH);
    const appNgModuleFile = context.fileCache.get(appNgModulePath);
    if (!appNgModuleFile) {
        throw new Error(`App NgModule ${appNgModulePath} not found in cache`);
    }
    const updatedAppNgModuleContent = getUpdatedAppNgModuleContentWithDeepLinkConfig(appNgModulePath, appNgModuleFile.content, deepLinkString);
    context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: updatedAppNgModuleContent });
    if (changedFiles) {
        changedFiles.push({
            event: 'change',
            filePath: appNgModulePath,
            ext: path_1.extname(appNgModulePath).toLowerCase()
        });
    }
}
exports.updateAppNgModuleWithDeepLinkConfig = updateAppNgModuleWithDeepLinkConfig;
function getUpdatedAppNgModuleContentWithDeepLinkConfig(appNgModuleFilePath, appNgModuleFileContent, deepLinkStringContent) {
    let sourceFile = typescript_utils_1.getTypescriptSourceFile(appNgModuleFilePath, appNgModuleFileContent);
    let decorator = typescript_utils_1.getNgModuleDecorator(appNgModuleFilePath, sourceFile);
    let functionCall = getIonicModuleForRootCall(decorator);
    if (functionCall.arguments.length === 1) {
        appNgModuleFileContent = addDefaultSecondArgumentToAppNgModule(appNgModuleFileContent, functionCall);
        sourceFile = typescript_utils_1.getTypescriptSourceFile(appNgModuleFilePath, appNgModuleFileContent);
        decorator = typescript_utils_1.getNgModuleDecorator(appNgModuleFilePath, sourceFile);
        functionCall = getIonicModuleForRootCall(decorator);
    }
    if (functionCall.arguments.length === 2) {
        // we need to add the node
        return addDeepLinkArgumentToAppNgModule(appNgModuleFileContent, functionCall, deepLinkStringContent);
    }
    // we need to replace whatever node exists here with the deeplink config
    return typescript_utils_1.replaceNode(appNgModuleFilePath, appNgModuleFileContent, functionCall.arguments[2], deepLinkStringContent);
}
exports.getUpdatedAppNgModuleContentWithDeepLinkConfig = getUpdatedAppNgModuleContentWithDeepLinkConfig;
function getUpdatedAppNgModuleFactoryContentWithDeepLinksConfig(appNgModuleFactoryFileContent, deepLinkStringContent) {
    // tried to do this with typescript API, wasn't clear on how to do it
    const regex = /this.*?DeepLinkConfigToken.*?=([\s\S]*?);/g;
    const results = regex.exec(appNgModuleFactoryFileContent);
    if (results && results.length === 2) {
        const actualString = results[0];
        const chunkToReplace = results[1];
        const fullStringToReplace = actualString.replace(chunkToReplace, deepLinkStringContent);
        return appNgModuleFactoryFileContent.replace(actualString, fullStringToReplace);
    }
    throw new Error('The RegExp to find the DeepLinkConfigToken did not return valid data');
}
exports.getUpdatedAppNgModuleFactoryContentWithDeepLinksConfig = getUpdatedAppNgModuleFactoryContentWithDeepLinksConfig;
function addDefaultSecondArgumentToAppNgModule(appNgModuleFileContent, ionicModuleForRoot) {
    const argOneNode = ionicModuleForRoot.arguments[0];
    const updatedFileContent = typescript_utils_1.appendAfter(appNgModuleFileContent, argOneNode, ', {}');
    return updatedFileContent;
}
exports.addDefaultSecondArgumentToAppNgModule = addDefaultSecondArgumentToAppNgModule;
function addDeepLinkArgumentToAppNgModule(appNgModuleFileContent, ionicModuleForRoot, deepLinkString) {
    const argTwoNode = ionicModuleForRoot.arguments[1];
    const updatedFileContent = typescript_utils_1.appendAfter(appNgModuleFileContent, argTwoNode, `, ${deepLinkString}`);
    return updatedFileContent;
}
exports.addDeepLinkArgumentToAppNgModule = addDeepLinkArgumentToAppNgModule;
function generateDefaultDeepLinkNgModuleContent(pageFilePath, className) {
    const importFrom = path_1.basename(pageFilePath, '.ts');
    return `
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ${className} } from './${importFrom}';

@NgModule({
  declarations: [
    ${className},
  ],
  imports: [
    IonicPageModule.forChild(${className})
  ]
})
export class ${className}Module {}

`;
}
exports.generateDefaultDeepLinkNgModuleContent = generateDefaultDeepLinkNgModuleContent;
function purgeDeepLinkDecoratorTSTransform() {
    return purgeDeepLinkDecoratorTSTransformImpl;
}
exports.purgeDeepLinkDecoratorTSTransform = purgeDeepLinkDecoratorTSTransform;
function purgeDeepLinkDecoratorTSTransformImpl(transformContext) {
    function visitClassDeclaration(classDeclaration) {
        let hasDeepLinkDecorator = false;
        const diffDecorators = [];
        for (const decorator of classDeclaration.decorators || []) {
            if (decorator.expression && decorator.expression.expression
                && decorator.expression.expression.text === DEEPLINK_DECORATOR_TEXT) {
                hasDeepLinkDecorator = true;
            }
            else {
                diffDecorators.push(decorator);
            }
        }
        if (hasDeepLinkDecorator) {
            return typescript_1.updateClassDeclaration(classDeclaration, diffDecorators, classDeclaration.modifiers, classDeclaration.name, classDeclaration.typeParameters, classDeclaration.heritageClauses, classDeclaration.members);
        }
        return classDeclaration;
    }
    function visitImportDeclaration(importDeclaration, sourceFile) {
        if (importDeclaration.moduleSpecifier
            && importDeclaration.moduleSpecifier.text === 'ionic-angular'
            && importDeclaration.importClause
            && importDeclaration.importClause.namedBindings
            && importDeclaration.importClause.namedBindings.elements) {
            // loop over each import and store it
            const importSpecifiers = [];
            importDeclaration.importClause.namedBindings.elements.forEach((importSpecifier) => {
                if (importSpecifier.name.text !== DEEPLINK_DECORATOR_TEXT) {
                    importSpecifiers.push(importSpecifier);
                }
            });
            const emptyNamedImports = typescript_1.createNamedImports(importSpecifiers);
            const newImportClause = typescript_1.updateImportClause(importDeclaration.importClause, importDeclaration.importClause.name, emptyNamedImports, false);
            return typescript_1.updateImportDeclaration(importDeclaration, importDeclaration.decorators, importDeclaration.modifiers, newImportClause, importDeclaration.moduleSpecifier);
        }
        return importDeclaration;
    }
    function visit(node, sourceFile) {
        switch (node.kind) {
            case typescript_1.SyntaxKind.ClassDeclaration:
                return visitClassDeclaration(node);
            case typescript_1.SyntaxKind.ImportDeclaration:
                return visitImportDeclaration(node, sourceFile);
            default:
                return typescript_1.visitEachChild(node, (node) => {
                    return visit(node, sourceFile);
                }, transformContext);
        }
    }
    return (sourceFile) => {
        return visit(sourceFile, sourceFile);
    };
}
exports.purgeDeepLinkDecoratorTSTransformImpl = purgeDeepLinkDecoratorTSTransformImpl;
function purgeDeepLinkDecorator(inputText) {
    const sourceFile = typescript_utils_1.getTypescriptSourceFile('', inputText);
    const classDeclarations = typescript_utils_1.getClassDeclarations(sourceFile);
    const toRemove = [];
    let toReturn = inputText;
    for (const classDeclaration of classDeclarations) {
        for (const decorator of classDeclaration.decorators || []) {
            if (decorator.expression && decorator.expression.expression
                && decorator.expression.expression.text === DEEPLINK_DECORATOR_TEXT) {
                toRemove.push(decorator);
            }
        }
    }
    toRemove.forEach(node => {
        toReturn = typescript_utils_1.replaceNode('', inputText, node, '');
    });
    toReturn = purgeDeepLinkImport(toReturn);
    return toReturn;
}
exports.purgeDeepLinkDecorator = purgeDeepLinkDecorator;
function purgeDeepLinkImport(inputText) {
    const sourceFile = typescript_utils_1.getTypescriptSourceFile('', inputText);
    const importDeclarations = typescript_utils_1.findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.ImportDeclaration);
    importDeclarations.forEach(importDeclaration => {
        if (importDeclaration.moduleSpecifier
            && importDeclaration.moduleSpecifier.text === 'ionic-angular'
            && importDeclaration.importClause
            && importDeclaration.importClause.namedBindings
            && importDeclaration.importClause.namedBindings.elements) {
            // loop over each import and store it
            let decoratorIsImported = false;
            const namedImportStrings = [];
            importDeclaration.importClause.namedBindings.elements.forEach((importSpecifier) => {
                if (importSpecifier.name.text === DEEPLINK_DECORATOR_TEXT) {
                    decoratorIsImported = true;
                }
                else {
                    namedImportStrings.push(importSpecifier.name.text);
                }
            });
            // okay, cool. If namedImportStrings is empty, then just remove the entire import statement
            // otherwise, just replace the named imports with the namedImportStrings separated by a comma
            if (decoratorIsImported) {
                if (namedImportStrings.length) {
                    // okay cool, we only want to remove some of these homies
                    const stringRepresentation = namedImportStrings.join(', ');
                    const namedImportString = `{ ${stringRepresentation} }`;
                    inputText = typescript_utils_1.replaceNode('', inputText, importDeclaration.importClause.namedBindings, namedImportString);
                }
                else {
                    // remove the entire import statement
                    inputText = typescript_utils_1.replaceNode('', inputText, importDeclaration, '');
                }
            }
        }
    });
    return inputText;
}
exports.purgeDeepLinkImport = purgeDeepLinkImport;
function getInjectDeepLinkConfigTypescriptTransform() {
    const deepLinkString = convertDeepLinkConfigEntriesToString(helpers_1.getParsedDeepLinkConfig());
    const appNgModulePath = helpers_1.toUnixPath(helpers_1.getStringPropertyValue(Constants.ENV_APP_NG_MODULE_PATH));
    return injectDeepLinkConfigTypescriptTransform(deepLinkString, appNgModulePath);
}
exports.getInjectDeepLinkConfigTypescriptTransform = getInjectDeepLinkConfigTypescriptTransform;
function injectDeepLinkConfigTypescriptTransform(deepLinkString, appNgModuleFilePath) {
    function visitDecoratorNode(decorator, sourceFile) {
        if (decorator.expression && decorator.expression.expression && decorator.expression.expression.text === typescript_utils_1.NG_MODULE_DECORATOR_TEXT) {
            // okay cool, we have the ng module
            let functionCall = getIonicModuleForRootCall(decorator);
            const updatedArgs = functionCall.arguments;
            if (updatedArgs.length === 1) {
                updatedArgs.push(typescript_1.createIdentifier('{ }'));
            }
            if (updatedArgs.length === 2) {
                updatedArgs.push(typescript_1.createIdentifier(deepLinkString));
            }
            functionCall = typescript_1.updateCall(functionCall, functionCall.expression, functionCall.typeArguments, updatedArgs);
            // loop over the parent elements and replace the IonicModule expression with ours'
            for (let i = 0; i < (functionCall.parent.elements || []).length; i++) {
                const element = functionCall.parent.elements[i];
                if (element.king === typescript_1.SyntaxKind.CallExpression
                    && element.expression
                    && element.expression.expression
                    && element.expression.expression.escapedText === 'IonicModule') {
                    functionCall.parent.elements[i] = functionCall;
                }
            }
        }
        return decorator;
    }
    return (transformContext) => {
        function visit(node, sourceFile, sourceFilePath) {
            if (sourceFilePath !== appNgModuleFilePath) {
                return node;
            }
            switch (node.kind) {
                case typescript_1.SyntaxKind.Decorator:
                    return visitDecoratorNode(node, sourceFile);
                default:
                    return typescript_1.visitEachChild(node, (node) => {
                        return visit(node, sourceFile, sourceFilePath);
                    }, transformContext);
            }
        }
        return (sourceFile) => {
            return visit(sourceFile, sourceFile, sourceFile.fileName);
        };
    };
}
exports.injectDeepLinkConfigTypescriptTransform = injectDeepLinkConfigTypescriptTransform;
const DEEPLINK_DECORATOR_TEXT = 'IonicPage';
const DEEPLINK_DECORATOR_NAME_ATTRIBUTE = 'name';
const DEEPLINK_DECORATOR_SEGMENT_ATTRIBUTE = 'segment';
const DEEPLINK_DECORATOR_PRIORITY_ATTRIBUTE = 'priority';
const DEEPLINK_DECORATOR_DEFAULT_HISTORY_ATTRIBUTE = 'defaultHistory';
const NG_MODULE_IMPORT_DECLARATION = 'imports';
const IONIC_MODULE_NAME = 'IonicModule';
const FOR_ROOT_METHOD = 'forRoot';
const LOAD_CHILDREN_SEPARATOR = '#';
