"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTypeScriptDiagnostics = void 0;
const logger_1 = require("./logger");
const highlight_1 = require("../highlight/highlight");
const helpers_1 = require("../util/helpers");
const ts = require("typescript");
/**
 * Ok, so formatting overkill, we know. But whatever, it makes for great
 * error reporting within a terminal. So, yeah, let's code it up, shall we?
 */
function runTypeScriptDiagnostics(context, tsDiagnostics) {
    return tsDiagnostics.map(tsDiagnostic => {
        return loadDiagnostic(context, tsDiagnostic);
    });
}
exports.runTypeScriptDiagnostics = runTypeScriptDiagnostics;
function loadDiagnostic(context, tsDiagnostic) {
    const d = {
        level: 'error',
        type: 'typescript',
        language: 'typescript',
        header: 'typescript error',
        code: tsDiagnostic.code.toString(),
        messageText: ts.flattenDiagnosticMessageText(tsDiagnostic.messageText, '\n'),
        relFileName: null,
        absFileName: null,
        lines: []
    };
    if (tsDiagnostic.file && tsDiagnostic.file.getText) {
        d.absFileName = tsDiagnostic.file.fileName;
        d.relFileName = logger_1.Logger.formatFileName(context.rootDir, d.absFileName);
        let sourceText = tsDiagnostic.file.getText();
        let srcLines = helpers_1.splitLineBreaks(sourceText);
        let htmlLines = srcLines;
        try {
            htmlLines = helpers_1.splitLineBreaks(highlight_1.highlight(d.language, sourceText, true).value);
        }
        catch (e) { }
        const posData = tsDiagnostic.file.getLineAndCharacterOfPosition(tsDiagnostic.start);
        const errorLine = {
            lineIndex: posData.line,
            lineNumber: posData.line + 1,
            text: srcLines[posData.line],
            html: htmlLines[posData.line],
            errorCharStart: posData.character,
            errorLength: Math.max(tsDiagnostic.length, 1)
        };
        if (errorLine.html && errorLine.html.indexOf('class="hljs') === -1) {
            try {
                errorLine.html = highlight_1.highlight(d.language, errorLine.text, true).value;
            }
            catch (e) { }
        }
        d.lines.push(errorLine);
        if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
            errorLine.errorLength = 1;
            errorLine.errorCharStart--;
        }
        d.header = logger_1.Logger.formatHeader('typescript', tsDiagnostic.file.fileName, context.rootDir, errorLine.lineNumber);
        if (errorLine.lineIndex > 0) {
            const previousLine = {
                lineIndex: errorLine.lineIndex - 1,
                lineNumber: errorLine.lineNumber - 1,
                text: srcLines[errorLine.lineIndex - 1],
                html: htmlLines[errorLine.lineIndex - 1],
                errorCharStart: -1,
                errorLength: -1
            };
            if (previousLine.html && previousLine.html.indexOf('class="hljs') === -1) {
                try {
                    previousLine.html = highlight_1.highlight(d.language, previousLine.text, true).value;
                }
                catch (e) { }
            }
            d.lines.unshift(previousLine);
        }
        if (errorLine.lineIndex + 1 < srcLines.length) {
            const nextLine = {
                lineIndex: errorLine.lineIndex + 1,
                lineNumber: errorLine.lineNumber + 1,
                text: srcLines[errorLine.lineIndex + 1],
                html: htmlLines[errorLine.lineIndex + 1],
                errorCharStart: -1,
                errorLength: -1
            };
            if (nextLine.html && nextLine.html.indexOf('class="hljs') === -1) {
                try {
                    nextLine.html = highlight_1.highlight(d.language, nextLine.text, true).value;
                }
                catch (e) { }
            }
            d.lines.push(nextLine);
        }
    }
    return d;
}
