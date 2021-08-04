"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBuildUpdate = exports.copyUpdate = exports.queueOrRunBuildUpdate = exports.queuedChangedFileMap = exports.buildUpdatePromise = exports.queueWatchUpdatesForBuild = exports.buildUpdate = exports.prepareWatcher = exports.watch = void 0;
const path_1 = require("path");
const chokidar = require("chokidar");
const buildTask = require("./build");
const copy_1 = require("./copy");
const logger_1 = require("./logger/logger");
const transpile_1 = require("./transpile");
const config_1 = require("./util/config");
const Constants = require("./util/constants");
const errors_1 = require("./util/errors");
const helpers_1 = require("./util/helpers");
const interfaces_1 = require("./util/interfaces");
// https://github.com/paulmillr/chokidar
function watch(context, configFile) {
    configFile = config_1.getUserConfigFile(context, taskInfo, configFile);
    // Override all build options if watch is ran.
    context.isProd = false;
    context.optimizeJs = false;
    context.runMinifyJs = false;
    context.runMinifyCss = false;
    context.runAot = false;
    // Ensure that watch is true in context
    context.isWatch = true;
    context.sassState = interfaces_1.BuildState.RequiresBuild;
    context.transpileState = interfaces_1.BuildState.RequiresBuild;
    context.bundleState = interfaces_1.BuildState.RequiresBuild;
    context.deepLinkState = interfaces_1.BuildState.RequiresBuild;
    const logger = new logger_1.Logger('watch');
    function buildDone() {
        return startWatchers(context, configFile).then(() => {
            logger.ready();
        });
    }
    return buildTask.build(context)
        .then(buildDone, (err) => {
        if (err && err.isFatal) {
            throw err;
        }
        else {
            buildDone();
        }
    })
        .catch(err => {
        throw logger.fail(err);
    });
}
exports.watch = watch;
function startWatchers(context, configFile) {
    const watchConfig = config_1.fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
    const promises = [];
    Object.keys(watchConfig).forEach((key) => {
        promises.push(startWatcher(key, watchConfig[key], context));
    });
    return Promise.all(promises);
}
function startWatcher(name, watcher, context) {
    return new Promise((resolve, reject) => {
        // If a file isn't found (probably other scenarios too),
        // Chokidar watches don't always trigger the ready or error events
        // so set a timeout, and clear it if they do fire
        // otherwise, just reject the promise and log an error
        const timeoutId = setTimeout(() => {
            let filesWatchedString = null;
            if (typeof watcher.paths === 'string') {
                filesWatchedString = watcher.paths;
            }
            else if (Array.isArray(watcher.paths)) {
                filesWatchedString = watcher.paths.join(', ');
            }
            reject(new errors_1.BuildError(`A watch configured to watch the following paths failed to start. It likely that a file referenced does not exist: ${filesWatchedString}`));
        }, helpers_1.getIntPropertyValue(Constants.ENV_START_WATCH_TIMEOUT));
        prepareWatcher(context, watcher);
        if (!watcher.paths) {
            logger_1.Logger.error(`watcher config, entry ${name}: missing "paths"`);
            resolve();
            return;
        }
        if (!watcher.callback) {
            logger_1.Logger.error(`watcher config, entry ${name}: missing "callback"`);
            resolve();
            return;
        }
        const chokidarWatcher = chokidar.watch(watcher.paths, watcher.options);
        let eventName = 'all';
        if (watcher.eventName) {
            eventName = watcher.eventName;
        }
        chokidarWatcher.on(eventName, (event, filePath) => {
            // if you're listening for a specific event vs 'all',
            // the event is not included and the first param is the filePath
            // go ahead and adjust it if filePath is null so it's uniform
            if (!filePath) {
                filePath = event;
                event = watcher.eventName;
            }
            filePath = path_1.normalize(path_1.resolve(path_1.join(context.rootDir, filePath)));
            logger_1.Logger.debug(`watch callback start, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);
            const callbackToExecute = function (event, filePath, context, watcher) {
                return watcher.callback(event, filePath, context);
            };
            callbackToExecute(event, filePath, context, watcher)
                .then(() => {
                logger_1.Logger.debug(`watch callback complete, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);
                watchCount++;
            })
                .catch(err => {
                logger_1.Logger.debug(`watch callback error, id: ${watchCount}, isProd: ${context.isProd}, event: ${event}, path: ${filePath}`);
                logger_1.Logger.debug(`${err}`);
                watchCount++;
            });
        });
        chokidarWatcher.on('ready', () => {
            clearTimeout(timeoutId);
            logger_1.Logger.debug(`watcher ready: ${watcher.options.cwd}${watcher.paths}`);
            resolve();
        });
        chokidarWatcher.on('error', (err) => {
            clearTimeout(timeoutId);
            reject(new errors_1.BuildError(`watcher error: ${watcher.options.cwd}${watcher.paths}: ${err}`));
        });
    });
}
function prepareWatcher(context, watcher) {
    watcher.options = watcher.options || {};
    if (!watcher.options.cwd) {
        watcher.options.cwd = context.rootDir;
    }
    if (typeof watcher.options.ignoreInitial !== 'boolean') {
        watcher.options.ignoreInitial = true;
    }
    if (watcher.options.ignored) {
        if (Array.isArray(watcher.options.ignored)) {
            watcher.options.ignored = watcher.options.ignored.map(p => path_1.normalize(config_1.replacePathVars(context, p)));
        }
        else if (typeof watcher.options.ignored === 'string') {
            // it's a string, so just do it once and leave it
            watcher.options.ignored = path_1.normalize(config_1.replacePathVars(context, watcher.options.ignored));
        }
    }
    if (watcher.paths) {
        if (Array.isArray(watcher.paths)) {
            watcher.paths = watcher.paths.map(p => path_1.normalize(config_1.replacePathVars(context, p)));
        }
        else {
            watcher.paths = path_1.normalize(config_1.replacePathVars(context, watcher.paths));
        }
    }
}
exports.prepareWatcher = prepareWatcher;
let queuedWatchEventsMap = new Map();
let queuedWatchEventsTimerId;
function buildUpdate(event, filePath, context) {
    return queueWatchUpdatesForBuild(event, filePath, context);
}
exports.buildUpdate = buildUpdate;
function queueWatchUpdatesForBuild(event, filePath, context) {
    const changedFile = {
        event: event,
        filePath: filePath,
        ext: path_1.extname(filePath).toLowerCase()
    };
    queuedWatchEventsMap.set(filePath, changedFile);
    // debounce our build update incase there are multiple files
    clearTimeout(queuedWatchEventsTimerId);
    // run this code in a few milliseconds if another hasn't come in behind it
    queuedWatchEventsTimerId = setTimeout(() => {
        // figure out what actually needs to be rebuilt
        const queuedChangeFileList = [];
        queuedWatchEventsMap.forEach(changedFile => queuedChangeFileList.push(changedFile));
        const changedFiles = runBuildUpdate(context, queuedChangeFileList);
        // clear out all the files that are queued up for the build update
        queuedWatchEventsMap.clear();
        if (changedFiles && changedFiles.length) {
            // cool, we've got some build updating to do ;)
            queueOrRunBuildUpdate(changedFiles, context);
        }
    }, BUILD_UPDATE_DEBOUNCE_MS);
    return Promise.resolve();
}
exports.queueWatchUpdatesForBuild = queueWatchUpdatesForBuild;
// exported just for use in unit testing
exports.buildUpdatePromise = null;
exports.queuedChangedFileMap = new Map();
function queueOrRunBuildUpdate(changedFiles, context) {
    if (exports.buildUpdatePromise) {
        // there is an active build going on, so queue our changes and run
        // another build when this one finishes
        // in the event this is called multiple times while queued, we are following a "last event wins" pattern
        // so if someone makes an edit, and then deletes a file, the last "ChangedFile" is the one we act upon
        changedFiles.forEach(changedFile => {
            exports.queuedChangedFileMap.set(changedFile.filePath, changedFile);
        });
        return exports.buildUpdatePromise;
    }
    else {
        // there is not an active build going going on
        // clear out any queued file changes, and run the build
        exports.queuedChangedFileMap.clear();
        const buildUpdateCompleteCallback = () => {
            // the update is complete, so check if there are pending updates that need to be run
            exports.buildUpdatePromise = null;
            if (exports.queuedChangedFileMap.size > 0) {
                const queuedChangeFileList = [];
                exports.queuedChangedFileMap.forEach(changedFile => {
                    queuedChangeFileList.push(changedFile);
                });
                return queueOrRunBuildUpdate(queuedChangeFileList, context);
            }
            return Promise.resolve();
        };
        exports.buildUpdatePromise = buildTask.buildUpdate(changedFiles, context);
        return exports.buildUpdatePromise.then(buildUpdateCompleteCallback).catch((err) => {
            return buildUpdateCompleteCallback();
        });
    }
}
exports.queueOrRunBuildUpdate = queueOrRunBuildUpdate;
let queuedCopyChanges = [];
let queuedCopyTimerId;
function copyUpdate(event, filePath, context) {
    const changedFile = {
        event: event,
        filePath: filePath,
        ext: path_1.extname(filePath).toLowerCase()
    };
    // do not allow duplicates
    if (!queuedCopyChanges.some(f => f.filePath === filePath)) {
        queuedCopyChanges.push(changedFile);
        // debounce our build update incase there are multiple files
        clearTimeout(queuedCopyTimerId);
        // run this code in a few milliseconds if another hasn't come in behind it
        queuedCopyTimerId = setTimeout(() => {
            const changedFiles = queuedCopyChanges.concat([]);
            // clear out all the files that are queued up for the build update
            queuedCopyChanges.length = 0;
            if (changedFiles && changedFiles.length) {
                // cool, we've got some build updating to do ;)
                copy_1.copyUpdate(changedFiles, context);
            }
        }, BUILD_UPDATE_DEBOUNCE_MS);
    }
    return Promise.resolve();
}
exports.copyUpdate = copyUpdate;
function runBuildUpdate(context, changedFiles) {
    if (!changedFiles || !changedFiles.length) {
        return null;
    }
    const jsFiles = changedFiles.filter(f => f.ext === '.js');
    if (jsFiles.length) {
        // this is mainly for linked modules
        // if a linked library has changed (which would have a js extention)
        // we should do a full transpile build because of this
        context.bundleState = interfaces_1.BuildState.RequiresUpdate;
    }
    const tsFiles = changedFiles.filter(f => f.ext === '.ts');
    if (tsFiles.length) {
        let requiresFullBuild = false;
        for (const tsFile of tsFiles) {
            if (!transpile_1.canRunTranspileUpdate(tsFile.event, tsFiles[0].filePath, context)) {
                requiresFullBuild = true;
                break;
            }
        }
        if (requiresFullBuild) {
            // .ts file was added or deleted, we need a full rebuild
            context.transpileState = interfaces_1.BuildState.RequiresBuild;
            context.deepLinkState = interfaces_1.BuildState.RequiresBuild;
        }
        else {
            // .ts files have changed, so we can get away with doing an update
            context.transpileState = interfaces_1.BuildState.RequiresUpdate;
            context.deepLinkState = interfaces_1.BuildState.RequiresUpdate;
        }
    }
    const sassFiles = changedFiles.filter(f => /^\.s(c|a)ss$/.test(f.ext));
    if (sassFiles.length) {
        // .scss or .sass file was changed/added/deleted, lets do a sass update
        context.sassState = interfaces_1.BuildState.RequiresUpdate;
    }
    const sassFilesNotChanges = changedFiles.filter(f => f.ext === '.ts' && f.event !== 'change');
    if (sassFilesNotChanges.length) {
        // .ts file was either added or deleted, so we'll have to
        // run sass again to add/remove that .ts file's potential .scss file
        context.sassState = interfaces_1.BuildState.RequiresUpdate;
    }
    const htmlFiles = changedFiles.filter(f => f.ext === '.html');
    if (htmlFiles.length) {
        if (context.bundleState === interfaces_1.BuildState.SuccessfulBuild && htmlFiles.every(f => f.event === 'change')) {
            // .html file was changed
            // just doing a template update is fine
            context.templateState = interfaces_1.BuildState.RequiresUpdate;
        }
        else {
            // .html file was added/deleted
            // we should do a full transpile build because of this
            context.transpileState = interfaces_1.BuildState.RequiresBuild;
            context.deepLinkState = interfaces_1.BuildState.RequiresBuild;
        }
    }
    if (context.transpileState === interfaces_1.BuildState.RequiresUpdate || context.transpileState === interfaces_1.BuildState.RequiresBuild) {
        if (context.bundleState === interfaces_1.BuildState.SuccessfulBuild || context.bundleState === interfaces_1.BuildState.RequiresUpdate) {
            // transpiling needs to happen
            // and there has already been a successful bundle before
            // so let's just do a bundle update
            context.bundleState = interfaces_1.BuildState.RequiresUpdate;
        }
        else {
            // transpiling needs to happen
            // but we've never successfully bundled before
            // so let's do a full bundle build
            context.bundleState = interfaces_1.BuildState.RequiresBuild;
        }
    }
    return changedFiles.concat();
}
exports.runBuildUpdate = runBuildUpdate;
const taskInfo = {
    fullArg: '--watch',
    shortArg: null,
    envVar: 'IONIC_WATCH',
    packageConfig: 'ionic_watch',
    defaultConfigFile: 'watch.config'
};
let watchCount = 0;
const BUILD_UPDATE_DEBOUNCE_MS = 20;
