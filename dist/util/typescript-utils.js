"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NG_MODULE_DECORATOR_TEXT = exports.appendNgModuleExports = exports.appendNgModuleProvider = exports.appendNgModuleDeclaration = exports.findObjectLiteralElementByName = exports.getNgModuleObjectLiteralArg = exports.getNgModuleDecorator = exports.getNgModuleClassName = exports.getClassDeclarations = exports.checkIfFunctionIsCalled = exports.replaceImportModuleSpecifier = exports.replaceNamedImport = exports.insertNamedImportIfNeeded = exports.appendBefore = exports.appendEmpty = exports.appendAfter = exports.getNodeStringContent = exports.removeNode = exports.replaceNode = exports.findNodes = exports.removeDecorators = exports.getTypescriptSourceFile = void 0;
const path = require("path");
const typescript_1 = require("typescript");
const helpers_1 = require("./helpers");
function getTypescriptSourceFile(filePath, fileContent, languageVersion = typescript_1.ScriptTarget.Latest, setParentNodes = false) {
    return typescript_1.createSourceFile(filePath, fileContent, languageVersion, setParentNodes);
}
exports.getTypescriptSourceFile = getTypescriptSourceFile;
function removeDecorators(fileName, source) {
    const sourceFile = typescript_1.createSourceFile(fileName, source, typescript_1.ScriptTarget.Latest);
    const decorators = findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.Decorator, true);
    decorators.sort((a, b) => b.pos - a.pos);
    decorators.forEach(d => {
        source = source.slice(0, d.pos) + source.slice(d.end);
    });
    return source;
}
exports.removeDecorators = removeDecorators;
function findNodes(sourceFile, node, kind, keepGoing = false) {
    if (node.kind === kind && !keepGoing) {
        return [node];
    }
    return node.getChildren(sourceFile).reduce((result, n) => {
        return result.concat(findNodes(sourceFile, n, kind, keepGoing));
    }, node.kind === kind ? [node] : []);
}
exports.findNodes = findNodes;
function replaceNode(filePath, fileContent, node, replacement) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const startIndex = node.getStart(sourceFile);
    const endIndex = node.getEnd();
    const modifiedContent = helpers_1.rangeReplace(fileContent, startIndex, endIndex, replacement);
    return modifiedContent;
}
exports.replaceNode = replaceNode;
function removeNode(filePath, fileContent, node) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const startIndex = node.getStart(sourceFile);
    const endIndex = node.getEnd();
    const modifiedContent = helpers_1.rangeReplace(fileContent, startIndex, endIndex, '');
    return modifiedContent;
}
exports.removeNode = removeNode;
function getNodeStringContent(sourceFile, node) {
    return sourceFile.getFullText().substring(node.getStart(sourceFile), node.getEnd());
}
exports.getNodeStringContent = getNodeStringContent;
function appendAfter(source, node, toAppend) {
    return helpers_1.stringSplice(source, node.getEnd(), 0, toAppend);
}
exports.appendAfter = appendAfter;
function appendEmpty(source, position, toAppend) {
    return helpers_1.stringSplice(source, position, 0, toAppend);
}
exports.appendEmpty = appendEmpty;
function appendBefore(filePath, fileContent, node, toAppend) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    return helpers_1.stringSplice(fileContent, node.getStart(sourceFile), 0, toAppend);
}
exports.appendBefore = appendBefore;
function insertNamedImportIfNeeded(filePath, fileContent, namedImport, fromModule) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allImports = findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.ImportDeclaration);
    const maybeImports = allImports.filter((node) => {
        return node.moduleSpecifier.kind === typescript_1.SyntaxKind.StringLiteral
            && node.moduleSpecifier.text === fromModule;
    }).filter((node) => {
        // Remove import statements that are either `import 'XYZ'` or `import * as X from 'XYZ'`.
        const clause = node.importClause;
        if (!clause || clause.name || !clause.namedBindings) {
            return false;
        }
        return clause.namedBindings.kind === typescript_1.SyntaxKind.NamedImports;
    }).map((node) => {
        return node.importClause.namedBindings;
    });
    if (maybeImports.length) {
        // There's an `import {A, B, C} from 'modulePath'`.
        // Find if it's in either imports. If so, just return; nothing to do.
        const hasImportAlready = maybeImports.some((node) => {
            return node.elements.some((element) => {
                return element.name.text === namedImport;
            });
        });
        if (hasImportAlready) {
            // it's already imported, so just return the original text
            return fileContent;
        }
        // Just pick the first one and insert at the end of its identifier list.
        fileContent = appendAfter(fileContent, maybeImports[0].elements[maybeImports[0].elements.length - 1], `, ${namedImport}`);
    }
    else {
        // Find the last import and insert after.
        fileContent = appendAfter(fileContent, allImports[allImports.length - 1], `\nimport { ${namedImport} } from '${fromModule}';`);
    }
    return fileContent;
}
exports.insertNamedImportIfNeeded = insertNamedImportIfNeeded;
function replaceNamedImport(filePath, fileContent, namedImportOriginal, namedImportReplacement) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allImports = findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.ImportDeclaration);
    let modifiedContent = fileContent;
    allImports.filter((node) => {
        if (node.importClause && node.importClause.namedBindings) {
            return node.importClause.namedBindings.kind === typescript_1.SyntaxKind.NamedImports;
        }
    }).map((importDeclaration) => {
        return importDeclaration.importClause.namedBindings;
    }).forEach((namedImport) => {
        return namedImport.elements.forEach((element) => {
            if (element.name.text === namedImportOriginal) {
                modifiedContent = replaceNode(filePath, modifiedContent, element, namedImportReplacement);
            }
        });
    });
    return modifiedContent;
}
exports.replaceNamedImport = replaceNamedImport;
function replaceImportModuleSpecifier(filePath, fileContent, moduleSpecifierOriginal, moduleSpecifierReplacement) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allImports = findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.ImportDeclaration);
    let modifiedContent = fileContent;
    allImports.forEach((node) => {
        if (node.moduleSpecifier.kind === typescript_1.SyntaxKind.StringLiteral && node.moduleSpecifier.text === moduleSpecifierOriginal) {
            modifiedContent = replaceNode(filePath, modifiedContent, node.moduleSpecifier, `'${moduleSpecifierReplacement}'`);
        }
    });
    return modifiedContent;
}
exports.replaceImportModuleSpecifier = replaceImportModuleSpecifier;
function checkIfFunctionIsCalled(filePath, fileContent, functionName) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allCalls = findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.CallExpression, true);
    const functionCallList = allCalls.filter(call => call.expression && call.expression.kind === typescript_1.SyntaxKind.Identifier && call.expression.text === functionName);
    return functionCallList.length > 0;
}
exports.checkIfFunctionIsCalled = checkIfFunctionIsCalled;
function getClassDeclarations(sourceFile) {
    return findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.ClassDeclaration, true);
}
exports.getClassDeclarations = getClassDeclarations;
function getNgModuleClassName(filePath, fileContent) {
    const ngModuleSourceFile = getTypescriptSourceFile(filePath, fileContent);
    const classDeclarations = getClassDeclarations(ngModuleSourceFile);
    // find the class with NgModule decorator;
    const classNameList = [];
    classDeclarations.forEach(classDeclaration => {
        if (classDeclaration && classDeclaration.decorators) {
            classDeclaration.decorators.forEach(decorator => {
                if (decorator.expression && decorator.expression.expression && decorator.expression.expression.text === exports.NG_MODULE_DECORATOR_TEXT) {
                    const className = classDeclaration.name.text;
                    classNameList.push(className);
                }
            });
        }
    });
    if (classNameList.length === 0) {
        throw new Error(`Could not find a class declaration in ${filePath}`);
    }
    if (classNameList.length > 1) {
        throw new Error(`Multiple class declarations with NgModule in ${filePath}. The correct class to use could not be determined.`);
    }
    return classNameList[0];
}
exports.getNgModuleClassName = getNgModuleClassName;
function getNgModuleDecorator(fileName, sourceFile) {
    const ngModuleDecorators = [];
    const classDeclarations = getClassDeclarations(sourceFile);
    classDeclarations.forEach(classDeclaration => {
        if (classDeclaration && classDeclaration.decorators) {
            classDeclaration.decorators.forEach(decorator => {
                if (decorator.expression && decorator.expression.expression && decorator.expression.expression.text === exports.NG_MODULE_DECORATOR_TEXT) {
                    ngModuleDecorators.push(decorator);
                }
            });
        }
    });
    if (ngModuleDecorators.length === 0) {
        throw new Error(`Could not find an "NgModule" decorator in ${fileName}`);
    }
    if (ngModuleDecorators.length > 1) {
        throw new Error(`Multiple "NgModule" decorators found in ${fileName}. The correct one to use could not be determined`);
    }
    return ngModuleDecorators[0];
}
exports.getNgModuleDecorator = getNgModuleDecorator;
function getNgModuleObjectLiteralArg(decorator) {
    const ngModuleArgs = decorator.expression.arguments;
    if (!ngModuleArgs || ngModuleArgs.length === 0 || ngModuleArgs.length > 1) {
        throw new Error(`Invalid NgModule Argument`);
    }
    return ngModuleArgs[0];
}
exports.getNgModuleObjectLiteralArg = getNgModuleObjectLiteralArg;
function findObjectLiteralElementByName(properties, identifierToLookFor) {
    return properties.filter((propertyNode) => {
        return propertyNode && propertyNode.name && propertyNode.name.text === identifierToLookFor;
    })[0];
}
exports.findObjectLiteralElementByName = findObjectLiteralElementByName;
function appendNgModuleDeclaration(filePath, fileContent, declaration) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const decorator = getNgModuleDecorator(path.basename(filePath), sourceFile);
    const obj = getNgModuleObjectLiteralArg(decorator);
    const properties = findObjectLiteralElementByName(obj.properties, 'declarations');
    const declarations = properties.initializer.elements;
    if (declarations.length === 0) {
        return appendEmpty(fileContent, declarations['end'], declaration);
    }
    else {
        return appendAfter(fileContent, declarations[declarations.length - 1], `,\n    ${declaration}`);
    }
}
exports.appendNgModuleDeclaration = appendNgModuleDeclaration;
function appendNgModuleProvider(filePath, fileContent, declaration) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const decorator = getNgModuleDecorator(path.basename(filePath), sourceFile);
    const obj = getNgModuleObjectLiteralArg(decorator);
    const properties = findObjectLiteralElementByName(obj.properties, 'providers');
    const providers = properties.initializer.elements;
    if (providers.length === 0) {
        return appendEmpty(fileContent, providers['end'], declaration);
    }
    else {
        return appendAfter(fileContent, providers[providers.length - 1], `,\n    ${declaration}`);
    }
}
exports.appendNgModuleProvider = appendNgModuleProvider;
function appendNgModuleExports(filePath, fileContent, declaration) {
    const sourceFile = getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const decorator = getNgModuleDecorator(path.basename(filePath), sourceFile);
    const obj = getNgModuleObjectLiteralArg(decorator);
    const properties = findObjectLiteralElementByName(obj.properties, 'exports');
    const exportsProp = properties.initializer.elements;
    if (exportsProp.length === 0) {
        return appendEmpty(fileContent, exportsProp['end'], declaration);
    }
    else {
        return appendAfter(fileContent, exportsProp[exportsProp.length - 1], `,\n    ${declaration}`);
    }
}
exports.appendNgModuleExports = appendNgModuleExports;
exports.NG_MODULE_DECORATOR_TEXT = 'NgModule';
