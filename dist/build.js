"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUpdate = exports.build = void 0;
const util_1 = require("./build/util");
const bundle_1 = require("./bundle");
const clean_1 = require("./clean");
const copy_1 = require("./copy");
const deep_linking_1 = require("./deep-linking");
const lint_1 = require("./lint");
const logger_1 = require("./logger/logger");
const minify_1 = require("./minify");
const ngc_1 = require("./ngc");
const postprocess_1 = require("./postprocess");
const preprocess_1 = require("./preprocess");
const sass_1 = require("./sass");
const template_1 = require("./template");
const transpile_1 = require("./transpile");
const Constants = require("./util/constants");
const errors_1 = require("./util/errors");
const events_1 = require("./util/events");
const helpers_1 = require("./util/helpers");
const interfaces_1 = require("./util/interfaces");
function build(context) {
    helpers_1.setContext(context);
    const logger = new logger_1.Logger(`build ${(context.isProd ? 'prod' : 'dev')}`);
    return buildWorker(context)
        .then(() => {
        // congrats, we did it!  (•_•) / ( •_•)>⌐■-■ / (⌐■_■)
        logger.finish();
    })
        .catch(err => {
        if (err.isFatal) {
            throw err;
        }
        throw logger.fail(err);
    });
}
exports.build = build;
function buildWorker(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [];
        promises.push(util_1.validateRequiredFilesExist(context));
        promises.push(util_1.readVersionOfDependencies(context));
        const results = yield Promise.all(promises);
        const tsConfigContents = results[0][1];
        yield util_1.validateTsConfigSettings(tsConfigContents);
        yield buildProject(context);
    });
}
function buildProject(context) {
    // sync empty the www/build directory
    clean_1.clean(context);
    buildId++;
    const copyPromise = copy_1.copy(context);
    return util_1.scanSrcTsFiles(context)
        .then(() => {
        if (helpers_1.getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS)) {
            return deep_linking_1.deepLinking(context);
        }
    })
        .then(() => {
        const compilePromise = (context.runAot) ? ngc_1.ngc(context) : transpile_1.transpile(context);
        return compilePromise;
    })
        .then(() => {
        return preprocess_1.preprocess(context);
    })
        .then(() => {
        return bundle_1.bundle(context);
    })
        .then(() => {
        const minPromise = (context.runMinifyJs) ? minify_1.minifyJs(context) : Promise.resolve();
        const sassPromise = sass_1.sass(context)
            .then(() => {
            return (context.runMinifyCss) ? minify_1.minifyCss(context) : Promise.resolve();
        });
        return Promise.all([
            minPromise,
            sassPromise,
            copyPromise
        ]);
    })
        .then(() => {
        return postprocess_1.postprocess(context);
    })
        .then(() => {
        if (helpers_1.getBooleanPropertyValue(Constants.ENV_ENABLE_LINT)) {
            // kick off the tslint after everything else
            // nothing needs to wait on its completion unless bailing on lint error is enabled
            const result = lint_1.lint(context, null, false);
            if (helpers_1.getBooleanPropertyValue(Constants.ENV_BAIL_ON_LINT_ERROR)) {
                return result;
            }
        }
    })
        .catch(err => {
        throw new errors_1.BuildError(err);
    });
}
function buildUpdate(changedFiles, context) {
    return new Promise(resolve => {
        const logger = new logger_1.Logger('build');
        buildId++;
        const buildUpdateMsg = {
            buildId: buildId,
            reloadApp: false
        };
        events_1.emit(events_1.EventType.BuildUpdateStarted, buildUpdateMsg);
        function buildTasksDone(resolveValue) {
            // all build tasks have been resolved or one of them
            // bailed early, stopping all others to not run
            parallelTasksPromise.then(() => {
                // all parallel tasks are also done
                // so now we're done done
                const buildUpdateMsg = {
                    buildId: buildId,
                    reloadApp: resolveValue.requiresAppReload
                };
                events_1.emit(events_1.EventType.BuildUpdateCompleted, buildUpdateMsg);
                if (!resolveValue.requiresAppReload) {
                    // just emit that only a certain file changed
                    // this one is useful when only a sass changed happened
                    // and the webpack only needs to livereload the css
                    // but does not need to do a full page refresh
                    events_1.emit(events_1.EventType.FileChange, resolveValue.changedFiles);
                }
                let requiresLintUpdate = false;
                for (const changedFile of changedFiles) {
                    if (changedFile.ext === '.ts') {
                        if (changedFile.event === 'change' || changedFile.event === 'add') {
                            requiresLintUpdate = true;
                            break;
                        }
                    }
                }
                if (requiresLintUpdate) {
                    // a ts file changed, so let's lint it too, however
                    // this task should run as an after thought
                    if (helpers_1.getBooleanPropertyValue(Constants.ENV_ENABLE_LINT)) {
                        lint_1.lintUpdate(changedFiles, context, false);
                    }
                }
                logger.finish('green', true);
                logger_1.Logger.newLine();
                // we did it!
                resolve();
            });
        }
        // kick off all the build tasks
        // and the tasks that can run parallel to all the build tasks
        const buildTasksPromise = buildUpdateTasks(changedFiles, context);
        const parallelTasksPromise = buildUpdateParallelTasks(changedFiles, context);
        // whether it was resolved or rejected, we need to do the same thing
        buildTasksPromise
            .then(buildTasksDone)
            .catch(() => {
            buildTasksDone({
                requiresAppReload: false,
                changedFiles: changedFiles
            });
        });
    });
}
exports.buildUpdate = buildUpdate;
/**
 * Collection of all the build tasks than need to run
 * Each task will only run if it's set with eacn BuildState.
 */
function buildUpdateTasks(changedFiles, context) {
    const resolveValue = {
        requiresAppReload: false,
        changedFiles: []
    };
    return loadFiles(changedFiles, context)
        .then(() => {
        // DEEP LINKING
        if (helpers_1.getBooleanPropertyValue(Constants.ENV_PARSE_DEEPLINKS)) {
            return deep_linking_1.deepLinkingUpdate(changedFiles, context);
        }
    })
        .then(() => {
        // TEMPLATE
        if (context.templateState === interfaces_1.BuildState.RequiresUpdate) {
            resolveValue.requiresAppReload = true;
            return template_1.templateUpdate(changedFiles, context);
        }
        // no template updates required
        return Promise.resolve();
    })
        .then(() => {
        // TRANSPILE
        if (context.transpileState === interfaces_1.BuildState.RequiresUpdate) {
            resolveValue.requiresAppReload = true;
            // we've already had a successful transpile once, only do an update
            // not that we've also already started a transpile diagnostics only
            // build that only needs to be completed by the end of buildUpdate
            return transpile_1.transpileUpdate(changedFiles, context);
        }
        else if (context.transpileState === interfaces_1.BuildState.RequiresBuild) {
            // run the whole transpile
            resolveValue.requiresAppReload = true;
            return transpile_1.transpile(context);
        }
        // no transpiling required
        return Promise.resolve();
    })
        .then(() => {
        // PREPROCESS
        return preprocess_1.preprocessUpdate(changedFiles, context);
    })
        .then(() => {
        // BUNDLE
        if (context.bundleState === interfaces_1.BuildState.RequiresUpdate) {
            // we need to do a bundle update
            resolveValue.requiresAppReload = true;
            return bundle_1.bundleUpdate(changedFiles, context);
        }
        else if (context.bundleState === interfaces_1.BuildState.RequiresBuild) {
            // we need to do a full bundle build
            resolveValue.requiresAppReload = true;
            return bundle_1.bundle(context);
        }
        // no bundling required
        return Promise.resolve();
    })
        .then(() => {
        // SASS
        if (context.sassState === interfaces_1.BuildState.RequiresUpdate) {
            // we need to do a sass update
            return sass_1.sassUpdate(changedFiles, context).then(outputCssFile => {
                const changedFile = {
                    event: Constants.FILE_CHANGE_EVENT,
                    ext: '.css',
                    filePath: outputCssFile
                };
                context.fileCache.set(outputCssFile, { path: outputCssFile, content: outputCssFile });
                resolveValue.changedFiles.push(changedFile);
            });
        }
        else if (context.sassState === interfaces_1.BuildState.RequiresBuild) {
            // we need to do a full sass build
            return sass_1.sass(context).then(outputCssFile => {
                const changedFile = {
                    event: Constants.FILE_CHANGE_EVENT,
                    ext: '.css',
                    filePath: outputCssFile
                };
                context.fileCache.set(outputCssFile, { path: outputCssFile, content: outputCssFile });
                resolveValue.changedFiles.push(changedFile);
            });
        }
        // no sass build required
        return Promise.resolve();
    })
        .then(() => {
        return resolveValue;
    });
}
function loadFiles(changedFiles, context) {
    // UPDATE IN-MEMORY FILE CACHE
    let promises = [];
    for (const changedFile of changedFiles) {
        if (changedFile.event === Constants.FILE_DELETE_EVENT) {
            // remove from the cache on delete
            context.fileCache.remove(changedFile.filePath);
        }
        else {
            // load the latest since the file changed
            const promise = helpers_1.readFileAsync(changedFile.filePath);
            promises.push(promise);
            promise.then((content) => {
                context.fileCache.set(changedFile.filePath, { path: changedFile.filePath, content: content });
            });
        }
    }
    return Promise.all(promises);
}
/**
 * parallelTasks are for any tasks that can run parallel to the entire
 * build, but we still need to make sure they've completed before we're
 * all done, it's also possible there are no parallelTasks at all
 */
function buildUpdateParallelTasks(changedFiles, context) {
    const parallelTasks = [];
    if (context.transpileState === interfaces_1.BuildState.RequiresUpdate) {
        parallelTasks.push(transpile_1.transpileDiagnosticsOnly(context));
    }
    return Promise.all(parallelTasks);
}
let buildId = 0;
