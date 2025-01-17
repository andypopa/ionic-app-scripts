"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationPort = exports.serve = void 0;
const config_1 = require("./util/config");
const helpers_1 = require("./util/helpers");
const logger_1 = require("./logger/logger");
const watch_1 = require("./watch");
const open_1 = require("./util/open");
const notification_server_1 = require("./dev-server/notification-server");
const http_server_1 = require("./dev-server/http-server");
const live_reload_1 = require("./dev-server/live-reload");
const serve_config_1 = require("./dev-server/serve-config");
const network_1 = require("./util/network");
const DEV_LOGGER_DEFAULT_PORT = 53703;
const LIVE_RELOAD_DEFAULT_PORT = 35729;
const DEV_SERVER_DEFAULT_PORT = 8100;
const DEV_SERVER_DEFAULT_HOST = '0.0.0.0';
function serve(context) {
    helpers_1.setContext(context);
    let config;
    let httpServer;
    const host = getHttpServerHost(context);
    const notificationPort = getNotificationPort(context);
    const liveReloadServerPort = getLiveReloadServerPort(context);
    const hostPort = getHttpServerPort(context);
    function finish() {
        if (config) {
            if (httpServer) {
                httpServer.listen(config.httpPort, config.host, function () {
                    logger_1.Logger.debug(`listening on ${config.httpPort}`);
                });
            }
            onReady(config, context);
        }
    }
    return network_1.findClosestOpenPorts(host, [notificationPort, liveReloadServerPort, hostPort])
        .then(([notificationPortFound, liveReloadServerPortFound, hostPortFound]) => {
        const hostLocation = (host === '0.0.0.0') ? 'localhost' : host;
        config = {
            httpPort: hostPortFound,
            host: host,
            hostBaseUrl: `http://${hostLocation}:${hostPortFound}`,
            rootDir: context.rootDir,
            wwwDir: context.wwwDir,
            buildDir: context.buildDir,
            isCordovaServe: isCordovaServe(context),
            launchBrowser: launchBrowser(context),
            launchLab: launchLab(context),
            browserToLaunch: browserToLaunch(context),
            useLiveReload: useLiveReload(context),
            liveReloadPort: liveReloadServerPortFound,
            notificationPort: notificationPortFound,
            useServerLogs: useServerLogs(context),
            useProxy: useProxy(context),
            notifyOnConsoleLog: sendClientConsoleLogs(context),
            devapp: false
        };
        notification_server_1.createNotificationServer(config);
        live_reload_1.createLiveReloadServer(config);
        httpServer = http_server_1.createHttpServer(config);
        return watch_1.watch(context);
    })
        .then(() => {
        finish();
        return config;
    }, (err) => {
        throw err;
    })
        .catch((err) => {
        if (err && err.isFatal) {
            throw err;
        }
        else {
            finish();
            return config;
        }
    });
}
exports.serve = serve;
function onReady(config, context) {
    if (config.launchBrowser) {
        const openOptions = [config.hostBaseUrl]
            .concat(launchLab(context) ? [serve_config_1.IONIC_LAB_URL] : [])
            .concat(browserOption(context) ? [browserOption(context)] : [])
            .concat(platformOption(context) ? ['?ionicplatform=', platformOption(context)] : []);
        open_1.default(openOptions.join(''), browserToLaunch(context), (error) => {
            if (error) {
                const errorMessage = error && error.message ? error.message : error.toString();
                logger_1.Logger.warn(`Failed to open the browser: ${errorMessage}`);
            }
        });
    }
    logger_1.Logger.info(`dev server running: ${config.hostBaseUrl}/`, 'green', true);
    logger_1.Logger.newLine();
}
function getHttpServerPort(context) {
    const port = config_1.getConfigValue(context, '--port', '-p', 'IONIC_PORT', 'ionic_port', null);
    if (port) {
        return parseInt(port, 10);
    }
    return DEV_SERVER_DEFAULT_PORT;
}
function getHttpServerHost(context) {
    const host = config_1.getConfigValue(context, '--address', '-h', 'IONIC_ADDRESS', 'ionic_address', null);
    if (host) {
        return host;
    }
    return DEV_SERVER_DEFAULT_HOST;
}
function getLiveReloadServerPort(context) {
    const port = config_1.getConfigValue(context, '--livereload-port', null, 'IONIC_LIVERELOAD_PORT', 'ionic_livereload_port', null);
    if (port) {
        return parseInt(port, 10);
    }
    return LIVE_RELOAD_DEFAULT_PORT;
}
function getNotificationPort(context) {
    const port = config_1.getConfigValue(context, '--dev-logger-port', null, 'IONIC_DEV_LOGGER_PORT', 'ionic_dev_logger_port', null);
    if (port) {
        return parseInt(port, 10);
    }
    return DEV_LOGGER_DEFAULT_PORT;
}
exports.getNotificationPort = getNotificationPort;
function useServerLogs(context) {
    return config_1.hasConfigValue(context, '--serverlogs', '-s', 'ionic_serverlogs', false);
}
function isCordovaServe(context) {
    return config_1.hasConfigValue(context, '--iscordovaserve', '-z', 'ionic_cordova_serve', false);
}
function launchBrowser(context) {
    return !config_1.hasConfigValue(context, '--nobrowser', '-b', 'ionic_launch_browser', false);
}
function browserToLaunch(context) {
    return config_1.getConfigValue(context, '--browser', '-w', 'IONIC_BROWSER', 'ionic_browser', null);
}
function browserOption(context) {
    return config_1.getConfigValue(context, '--browseroption', '-o', 'IONIC_BROWSEROPTION', 'ionic_browseroption', null);
}
function launchLab(context) {
    return config_1.hasConfigValue(context, '--lab', '-l', 'ionic_lab', false);
}
function platformOption(context) {
    return config_1.getConfigValue(context, '--platform', '-t', 'IONIC_PLATFORM_BROWSER', 'ionic_platform_browser', null);
}
function useLiveReload(context) {
    return !config_1.hasConfigValue(context, '--nolivereload', '-d', 'ionic_livereload', false);
}
function useProxy(context) {
    return !config_1.hasConfigValue(context, '--noproxy', '-x', 'ionic_proxy', false);
}
function sendClientConsoleLogs(context) {
    return config_1.hasConfigValue(context, '--consolelogs', '-c', 'ionic_consolelogs', false);
}
