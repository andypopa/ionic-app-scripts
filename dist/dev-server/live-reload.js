"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectLiveReloadScript = exports.createLiveReloadServer = void 0;
const logger_diagnostics_1 = require("../logger/logger-diagnostics");
const path = require("path");
const tinylr = require("tiny-lr");
const events = require("../util/events");
function createLiveReloadServer(config) {
    const liveReloadServer = tinylr();
    liveReloadServer.listen(config.liveReloadPort, config.host);
    function fileChange(changedFiles) {
        // only do a live reload if there are no diagnostics
        // the notification server takes care of showing diagnostics
        if (!logger_diagnostics_1.hasDiagnostics(config.buildDir)) {
            liveReloadServer.changed({
                body: {
                    files: changedFiles.map(changedFile => '/' + path.relative(config.wwwDir, changedFile.filePath))
                }
            });
        }
    }
    events.on(events.EventType.FileChange, fileChange);
    events.on(events.EventType.ReloadApp, () => {
        fileChange([{ event: 'change', ext: '.html', filePath: 'index.html' }]);
    });
}
exports.createLiveReloadServer = createLiveReloadServer;
function injectLiveReloadScript(content, host, port) {
    let contentStr = content.toString();
    const liveReloadScript = getLiveReloadScript(host, port);
    if (contentStr.indexOf('/livereload.js') > -1) {
        // already added script
        return content;
    }
    let match = contentStr.match(/<\/body>(?![\s\S]*<\/body>)/i);
    if (!match) {
        match = contentStr.match(/<\/html>(?![\s\S]*<\/html>)/i);
    }
    if (match) {
        contentStr = contentStr.replace(match[0], `${liveReloadScript}\n${match[0]}`);
    }
    else {
        contentStr += liveReloadScript;
    }
    return contentStr;
}
exports.injectLiveReloadScript = injectLiveReloadScript;
function getLiveReloadScript(host, port) {
    var src = `//${host}:${port}/livereload.js?snipver=1`;
    return `  <!-- Ionic Dev Server: Injected LiveReload Script -->\n  <script src="${src}" async="" defer=""></script>`;
}
