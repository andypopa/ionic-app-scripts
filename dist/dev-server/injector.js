"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectNotificationScript = void 0;
const helpers_1 = require("../util/helpers");
const serve_config_1 = require("./serve-config");
const LOGGER_HEADER = '<!-- Ionic Dev Server: Injected Logger Script -->';
function injectNotificationScript(rootDir, content, notifyOnConsoleLog, notificationPort) {
    let contentStr = content.toString();
    const consoleLogScript = getDevLoggerScript(rootDir, notifyOnConsoleLog, notificationPort);
    if (contentStr.indexOf(LOGGER_HEADER) > -1) {
        // already added script somehow
        return content;
    }
    let match = contentStr.match(/<head>(?![\s\S]*<head>)/i);
    if (!match) {
        match = contentStr.match(/<body>(?![\s\S]*<body>)/i);
    }
    if (match) {
        contentStr = contentStr.replace(match[0], `${match[0]}\n${consoleLogScript}`);
    }
    else {
        contentStr = consoleLogScript + contentStr;
    }
    return contentStr;
}
exports.injectNotificationScript = injectNotificationScript;
function getDevLoggerScript(rootDir, notifyOnConsoleLog, notificationPort) {
    const appScriptsVersion = helpers_1.getAppScriptsVersion();
    const ionDevServer = JSON.stringify({
        sendConsoleLogs: notifyOnConsoleLog,
        wsPort: notificationPort,
        appScriptsVersion: appScriptsVersion,
        systemInfo: helpers_1.getSystemText(rootDir)
    });
    return `
  ${LOGGER_HEADER}
  <script>var IonicDevServerConfig=${ionDevServer};</script>
  <link href="${serve_config_1.LOGGER_DIR}/ion-dev.css?v=${appScriptsVersion}" rel="stylesheet">
  <script src="${serve_config_1.LOGGER_DIR}/ion-dev.js?v=${appScriptsVersion}"></script>
  `;
}
