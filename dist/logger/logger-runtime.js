"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRuntimeStackDiagnostics = exports.generateRuntimeDiagnosticContent = void 0;
const helpers_1 = require("../util/helpers");
const logger_diagnostics_1 = require("./logger-diagnostics");
const highlight_1 = require("../highlight/highlight");
const fs_1 = require("fs");
const path_1 = require("path");
function generateRuntimeDiagnosticContent(rootDir, buildDir, runtimeErrorMessage, runtimeErrorStack) {
    let c = [];
    c.push(`<div class="ion-diagnostic">`);
    c.push(`<div class="ion-diagnostic-masthead">`);
    c.push(`<div class="ion-diagnostic-header">Runtime Error</div>`);
    if (runtimeErrorMessage) {
        runtimeErrorMessage = runtimeErrorMessage.replace(/inline template:\d+:\d+/g, '');
        runtimeErrorMessage = runtimeErrorMessage.replace('inline template', '');
        c.push(`<div class="ion-diagnostic-message">${helpers_1.escapeHtml(runtimeErrorMessage)}</div>`);
    }
    c.push(`</div>`); // .ion-diagnostic-masthead
    const diagnosticsHtmlCache = generateRuntimeStackDiagnostics(rootDir, runtimeErrorStack);
    diagnosticsHtmlCache.forEach(d => {
        c.push(logger_diagnostics_1.generateCodeBlock(d));
    });
    if (runtimeErrorStack) {
        c.push(`<div class="ion-diagnostic-stack-header">Stack</div>`);
        c.push(`<div class="ion-diagnostic-stack">${helpers_1.escapeHtml(runtimeErrorStack)}</div>`);
    }
    c.push(`</div>`); // .ion-diagnostic
    return logger_diagnostics_1.getDiagnosticsHtmlContent(buildDir, c.join('\n'));
}
exports.generateRuntimeDiagnosticContent = generateRuntimeDiagnosticContent;
function generateRuntimeStackDiagnostics(rootDir, stack) {
    const diagnostics = [];
    if (stack) {
        helpers_1.splitLineBreaks(stack).forEach(stackLine => {
            try {
                const match = WEBPACK_FILE_REGEX.exec(stackLine);
                if (!match)
                    return;
                const fileSplit = match[1].split('?');
                if (fileSplit.length !== 2)
                    return;
                const linesSplit = fileSplit[1].split(':');
                if (linesSplit.length !== 3)
                    return;
                const fileName = fileSplit[0];
                if (fileName.indexOf('~') > -1)
                    return;
                const errorLineNumber = parseInt(linesSplit[1], 10);
                const errorCharNumber = parseInt(linesSplit[2], 10);
                const d = {
                    level: 'error',
                    language: 'typescript',
                    type: 'runtime',
                    header: '',
                    code: 'runtime',
                    messageText: '',
                    absFileName: path_1.resolve(rootDir, fileName),
                    relFileName: path_1.normalize(fileName),
                    lines: []
                };
                const sourceText = fs_1.readFileSync(d.absFileName, 'utf8');
                const srcLines = helpers_1.splitLineBreaks(sourceText);
                if (!srcLines.length || errorLineNumber >= srcLines.length)
                    return;
                let htmlLines = srcLines;
                try {
                    htmlLines = helpers_1.splitLineBreaks(highlight_1.highlight(d.language, sourceText, true).value);
                }
                catch (e) { }
                const errorLine = {
                    lineIndex: errorLineNumber - 1,
                    lineNumber: errorLineNumber,
                    text: srcLines[errorLineNumber - 1],
                    html: htmlLines[errorLineNumber - 1],
                    errorCharStart: errorCharNumber + 1,
                    errorLength: 1
                };
                if (errorLine.html.indexOf('class="hljs') === -1) {
                    try {
                        errorLine.html = highlight_1.highlight(d.language, errorLine.text, true).value;
                    }
                    catch (e) { }
                }
                d.lines.push(errorLine);
                if (errorLine.lineIndex > 0) {
                    const previousLine = {
                        lineIndex: errorLine.lineIndex - 1,
                        lineNumber: errorLine.lineNumber - 1,
                        text: srcLines[errorLine.lineIndex - 1],
                        html: htmlLines[errorLine.lineIndex - 1],
                        errorCharStart: -1,
                        errorLength: -1
                    };
                    if (previousLine.html.indexOf('class="hljs') === -1) {
                        try {
                            previousLine.html = highlight_1.highlight(d.language, previousLine.text, true).value;
                        }
                        catch (e) { }
                    }
                    d.lines.unshift(previousLine);
                }
                if (errorLine.lineIndex < srcLines.length) {
                    const nextLine = {
                        lineIndex: errorLine.lineIndex + 1,
                        lineNumber: errorLine.lineNumber + 1,
                        text: srcLines[errorLine.lineIndex + 1],
                        html: htmlLines[errorLine.lineIndex + 1],
                        errorCharStart: -1,
                        errorLength: -1
                    };
                    if (nextLine.html.indexOf('class="hljs') === -1) {
                        try {
                            nextLine.html = highlight_1.highlight(d.language, nextLine.text, true).value;
                        }
                        catch (e) { }
                    }
                    d.lines.push(nextLine);
                }
                diagnostics.push(d);
            }
            catch (e) { }
        });
    }
    return diagnostics;
}
exports.generateRuntimeStackDiagnostics = generateRuntimeStackDiagnostics;
const WEBPACK_FILE_REGEX = /\(webpack:\/\/\/(.*?)\)/;
