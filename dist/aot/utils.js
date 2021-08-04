"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceBootstrapImpl = exports.getFallbackMainContent = void 0;
const path_1 = require("path");
const typescript_1 = require("typescript");
const typescript_utils_1 = require("../util/typescript-utils");
function getFallbackMainContent() {
    return `
import { platformBrowser } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';

import { AppModuleNgFactory } from './app.module.ngfactory';

enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);`;
}
exports.getFallbackMainContent = getFallbackMainContent;
function getBootstrapNodes(allCalls) {
    return allCalls
        .filter(call => call.expression.kind === typescript_1.SyntaxKind.PropertyAccessExpression)
        .map(call => call.expression)
        .filter(access => {
        return access.name.kind === typescript_1.SyntaxKind.Identifier
            && access.name.text === 'bootstrapModule';
    });
}
function replaceNgModuleClassName(filePath, fileContent, className) {
    const sourceFile = typescript_utils_1.getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allCalls = typescript_utils_1.findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.CallExpression, true);
    const bootstraps = getBootstrapNodes(allCalls);
    let modifiedContent = fileContent;
    allCalls.filter(call => bootstraps.some(bs => bs === call.expression)).forEach((call) => {
        modifiedContent = typescript_utils_1.replaceNode(filePath, modifiedContent, call.arguments[0], className + 'NgFactory');
    });
    return modifiedContent;
}
function replacePlatformBrowser(filePath, fileContent) {
    const sourceFile = typescript_utils_1.getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allCalls = typescript_utils_1.findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.CallExpression, true);
    const bootstraps = getBootstrapNodes(allCalls);
    const calls = bootstraps.reduce((previous, access) => {
        const expressions = typescript_utils_1.findNodes(sourceFile, access, typescript_1.SyntaxKind.CallExpression, true);
        return previous.concat(expressions);
    }, [])
        .filter((call) => {
        return call.expression.kind === typescript_1.SyntaxKind.Identifier
            && call.expression.text === 'platformBrowserDynamic';
    });
    let modifiedContent = fileContent;
    calls.forEach(call => {
        modifiedContent = typescript_utils_1.replaceNode(filePath, modifiedContent, call.expression, 'platformBrowser');
    });
    return modifiedContent;
}
function checkForPlatformDynamicBrowser(filePath, fileContent) {
    const sourceFile = typescript_utils_1.getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allCalls = typescript_utils_1.findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.CallExpression, true);
    const bootstraps = getBootstrapNodes(allCalls);
    const calls = bootstraps.reduce((previous, access) => {
        const expressions = typescript_utils_1.findNodes(sourceFile, access, typescript_1.SyntaxKind.CallExpression, true);
        return previous.concat(expressions);
    }, [])
        .filter((call) => {
        return call.expression.kind === typescript_1.SyntaxKind.Identifier
            && call.expression.text === 'platformBrowserDynamic';
    });
    return calls && calls.length;
}
function replaceBootstrapModuleFactory(filePath, fileContent) {
    const sourceFile = typescript_utils_1.getTypescriptSourceFile(filePath, fileContent, typescript_1.ScriptTarget.Latest, false);
    const allCalls = typescript_utils_1.findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.CallExpression, true);
    const bootstraps = getBootstrapNodes(allCalls);
    let modifiedContent = fileContent;
    bootstraps.forEach((bs) => {
        modifiedContent = typescript_utils_1.replaceNode(filePath, modifiedContent, bs.name, 'bootstrapModuleFactory');
    });
    return modifiedContent;
}
function getPlatformBrowserFunctionNode(filePath, fileContent) {
    let modifiedFileContent = fileContent;
    const sourceFile = typescript_utils_1.getTypescriptSourceFile(filePath, modifiedFileContent, typescript_1.ScriptTarget.Latest, false);
    const allCalls = typescript_utils_1.findNodes(sourceFile, sourceFile, typescript_1.SyntaxKind.CallExpression, true);
    const callsToPlatformBrowser = allCalls.filter(call => call.expression && call.expression.kind === typescript_1.SyntaxKind.Identifier && call.expression.text === 'platformBrowser');
    const toAppend = `enableProdMode();\n`;
    if (callsToPlatformBrowser.length) {
        modifiedFileContent = typescript_utils_1.appendBefore(filePath, modifiedFileContent, callsToPlatformBrowser[0].expression, toAppend);
    }
    else {
        // just throw it at the bottom
        modifiedFileContent += toAppend;
    }
    return modifiedFileContent;
}
function importAndEnableProdMode(filePath, fileContent) {
    let modifiedFileContent = fileContent;
    modifiedFileContent = typescript_utils_1.insertNamedImportIfNeeded(filePath, modifiedFileContent, 'enableProdMode', '@angular/core');
    const isCalled = typescript_utils_1.checkIfFunctionIsCalled(filePath, modifiedFileContent, 'enableProdMode');
    if (!isCalled) {
        // go ahead and insert this
        modifiedFileContent = getPlatformBrowserFunctionNode(filePath, modifiedFileContent);
    }
    return modifiedFileContent;
}
function replaceBootstrapImpl(filePath, fileContent, appNgModulePath, appNgModuleClassName) {
    if (!fileContent.match(/\bbootstrapModule\b/)) {
        throw new Error(`Could not find bootstrapModule in ${filePath}`);
    }
    const withoutExtension = path_1.join(path_1.dirname(appNgModulePath), path_1.basename(appNgModulePath, '.ts'));
    const appModuleAbsoluteFileName = path_1.normalize(path_1.resolve(withoutExtension));
    const withNgFactory = appModuleAbsoluteFileName + '.ngfactory';
    const originalImport = './' + path_1.relative(path_1.dirname(filePath), appModuleAbsoluteFileName);
    const ngFactryImport = './' + path_1.relative(path_1.dirname(filePath), withNgFactory);
    if (!checkForPlatformDynamicBrowser(filePath, fileContent)) {
        throw new Error(`Could not find any references to "platformBrowserDynamic" in ${filePath}`);
    }
    let modifiedFileContent = fileContent;
    modifiedFileContent = replaceNgModuleClassName(filePath, modifiedFileContent, appNgModuleClassName);
    modifiedFileContent = replacePlatformBrowser(filePath, modifiedFileContent);
    modifiedFileContent = replaceBootstrapModuleFactory(filePath, modifiedFileContent);
    modifiedFileContent = typescript_utils_1.replaceNamedImport(filePath, modifiedFileContent, 'platformBrowserDynamic', 'platformBrowser');
    modifiedFileContent = typescript_utils_1.replaceNamedImport(filePath, modifiedFileContent, appNgModuleClassName, appNgModuleClassName + 'NgFactory');
    modifiedFileContent = typescript_utils_1.replaceImportModuleSpecifier(filePath, modifiedFileContent, '@angular/platform-browser-dynamic', '@angular/platform-browser');
    modifiedFileContent = typescript_utils_1.replaceImportModuleSpecifier(filePath, modifiedFileContent, originalImport, ngFactryImport);
    // check if prod mode is imported and enabled
    modifiedFileContent = importAndEnableProdMode(filePath, modifiedFileContent);
    return modifiedFileContent;
}
exports.replaceBootstrapImpl = replaceBootstrapImpl;
