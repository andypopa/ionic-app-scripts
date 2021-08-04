"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDiagnostic = exports.runTsLintDiagnostics = void 0;
const helpers_1 = require("../util/helpers");
const logger_1 = require("./logger");
const STOP_CHARS = [' ', '=', ',', '.', '\t', '{', '}', '(', ')', '"', '\'', '`', '?', ':', ';', '+', '-', '*', '/', '<', '>', '&', '[', ']', '|'];
function runTsLintDiagnostics(context, failures) {
    return failures.map(failure => loadDiagnostic(context, failure));
}
exports.runTsLintDiagnostics = runTsLintDiagnostics;
function loadDiagnostic(context, failure) {
    const start = failure.getStartPosition()
        .toJson();
    const end = failure.getEndPosition()
        .toJson();
    const fileName = failure.getFileName();
    const sourceFile = failure.getRawLines();
    const d = {
        level: 'warn',
        type: 'tslint',
        language: 'typescript',
        absFileName: fileName,
        relFileName: logger_1.Logger.formatFileName(context.rootDir, fileName),
        header: logger_1.Logger.formatHeader('tslint', fileName, context.rootDir, start.line + 1, end.line + 1),
        code: failure.getRuleName(),
        messageText: failure.getFailure(),
        lines: []
    };
    if (sourceFile) {
        const srcLines = helpers_1.splitLineBreaks(sourceFile);
        for (let i = start.line; i <= end.line; i++) {
            if (srcLines[i].trim().length) {
                const errorLine = {
                    lineIndex: i,
                    lineNumber: i + 1,
                    text: srcLines[i],
                    html: srcLines[i],
                    errorCharStart: (i === start.line) ? start.character : (i === end.line) ? end.character : -1,
                    errorLength: 0,
                };
                for (let j = errorLine.errorCharStart; j < errorLine.text.length; j++) {
                    if (STOP_CHARS.indexOf(errorLine.text.charAt(j)) > -1) {
                        break;
                    }
                    errorLine.errorLength++;
                }
                if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
                    errorLine.errorLength = 1;
                    errorLine.errorCharStart--;
                }
                d.lines.push(errorLine);
            }
        }
        if (start.line > 0) {
            const beforeLine = {
                lineIndex: start.line - 1,
                lineNumber: start.line,
                text: srcLines[start.line - 1],
                html: srcLines[start.line - 1],
                errorCharStart: -1,
                errorLength: -1
            };
            d.lines.unshift(beforeLine);
        }
        if (end.line < srcLines.length) {
            const afterLine = {
                lineIndex: end.line + 1,
                lineNumber: end.line + 2,
                text: srcLines[end.line + 1],
                html: srcLines[end.line + 1],
                errorCharStart: -1,
                errorLength: -1
            };
            d.lines.push(afterLine);
        }
    }
    return d;
}
exports.loadDiagnostic = loadDiagnostic;
