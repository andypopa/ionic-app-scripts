"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskInfo = exports.copyConfigToWatchConfig = exports.copyUpdate = exports.copyWorker = exports.copy = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const logger_1 = require("./logger/logger");
const config_1 = require("./util/config");
const Constants = require("./util/constants");
const events_1 = require("./util/events");
const glob_util_1 = require("./util/glob-util");
const helpers_1 = require("./util/helpers");
const watch_1 = require("./watch");
const copyFilePathCache = new Map();
const FILTER_OUT_DIRS_FOR_CLEAN = ['{{WWW}}', '{{BUILD}}'];
function copy(context, configFile) {
    configFile = config_1.getUserConfigFile(context, exports.taskInfo, configFile);
    const logger = new logger_1.Logger('copy');
    return copyWorker(context, configFile)
        .then(() => {
        logger.finish();
    })
        .catch(err => {
        throw logger.fail(err);
    });
}
exports.copy = copy;
function copyWorker(context, configFile) {
    const copyConfig = config_1.fillConfigDefaults(configFile, exports.taskInfo.defaultConfigFile);
    const keys = Object.keys(copyConfig);
    const directoriesToCreate = new Set();
    const toCopyList = [];
    return Promise.resolve().then(() => {
        // for each entry, make sure each glob in the list of globs has had string replacement performed on it
        cleanConfigContent(keys, copyConfig, context);
        return getFilesPathsForConfig(keys, copyConfig);
    }).then((resultMap) => {
        // sweet, we have the absolute path of the files in the glob, and the ability to get the relative path
        // basically, we've got a stew goin'
        return populateFileAndDirectoryInfo(resultMap, copyConfig, toCopyList, directoriesToCreate);
    }).then(() => {
        if (helpers_1.getBooleanPropertyValue(Constants.ENV_CLEAN_BEFORE_COPY)) {
            cleanDirectories(context, directoriesToCreate);
        }
    }).then(() => {
        // create the directories synchronously to avoid any disk locking issues
        const directoryPathList = Array.from(directoriesToCreate);
        for (const directoryPath of directoryPathList) {
            fs_extra_1.mkdirpSync(directoryPath);
        }
    }).then(() => {
        // sweet, the directories are created, so now let's stream the files
        const promises = [];
        for (const file of toCopyList) {
            cacheCopyData(file);
            const promise = helpers_1.copyFileAsync(file.absoluteSourcePath, file.absoluteDestPath);
            promise.then(() => {
                logger_1.Logger.debug(`Successfully copied ${file.absoluteSourcePath} to ${file.absoluteDestPath}`);
            }).catch(err => {
                logger_1.Logger.warn(`Failed to copy ${file.absoluteSourcePath} to ${file.absoluteDestPath}`);
            });
            promises.push(promise);
        }
        return Promise.all(promises);
    });
}
exports.copyWorker = copyWorker;
function copyUpdate(changedFiles, context) {
    const logger = new logger_1.Logger('copy update');
    const configFile = config_1.getUserConfigFile(context, exports.taskInfo, null);
    const copyConfig = config_1.fillConfigDefaults(configFile, exports.taskInfo.defaultConfigFile);
    const keys = Object.keys(copyConfig);
    const directoriesToCreate = new Set();
    const toCopyList = [];
    return Promise.resolve().then(() => {
        changedFiles.forEach(changedFile => logger_1.Logger.debug(`copyUpdate, event: ${changedFile.event}, path: ${changedFile.filePath}`));
        // for each entry, make sure each glob in the list of globs has had string replacement performed on it
        cleanConfigContent(keys, copyConfig, context);
        return getFilesPathsForConfig(keys, copyConfig);
    }).then((resultMap) => {
        // sweet, we have the absolute path of the files in the glob, and the ability to get the relative path
        // basically, we've got a stew goin'
        return populateFileAndDirectoryInfo(resultMap, copyConfig, toCopyList, directoriesToCreate);
    }).then(() => {
        // first, process any deleted directories
        const promises = [];
        const directoryDeletions = changedFiles.filter(changedFile => changedFile.event === 'unlinkDir');
        directoryDeletions.forEach(changedFile => promises.push(processRemoveDir(changedFile)));
        return Promise.all(promises);
    }).then(() => {
        // process any deleted files
        const promises = [];
        const fileDeletions = changedFiles.filter(changedFile => changedFile.event === 'unlink');
        fileDeletions.forEach(changedFile => promises.push(processRemoveFile(changedFile)));
        return Promise.all(promises);
    }).then(() => {
        const promises = [];
        const additions = changedFiles.filter(changedFile => changedFile.event === 'change' || changedFile.event === 'add' || changedFile.event === 'addDir');
        additions.forEach(changedFile => {
            const matchingItems = toCopyList.filter(toCopyEntry => toCopyEntry.absoluteSourcePath === changedFile.filePath);
            matchingItems.forEach(matchingItem => {
                // create the directories first (if needed)
                fs_extra_1.mkdirpSync(path_1.dirname(matchingItem.absoluteDestPath));
                // cache the data and copy the files
                cacheCopyData(matchingItem);
                promises.push(helpers_1.copyFileAsync(matchingItem.absoluteSourcePath, matchingItem.absoluteDestPath));
                events_1.emit(events_1.EventType.FileChange, additions);
            });
        });
        return Promise.all(promises);
    }).then(() => {
        logger.finish('green', true);
        logger_1.Logger.newLine();
    }).catch(err => {
        throw logger.fail(err);
    });
}
exports.copyUpdate = copyUpdate;
function cleanDirectories(context, directoriesToCreate) {
    const filterOut = config_1.replacePathVars(context, FILTER_OUT_DIRS_FOR_CLEAN);
    const directoryPathList = Array.from(directoriesToCreate);
    // filter out any directories that we don't want to allow a clean on
    const cleanableDirectories = directoryPathList.filter(directoryPath => {
        for (const uncleanableDir of filterOut) {
            if (uncleanableDir === directoryPath) {
                return false;
            }
        }
        return true;
    });
    return deleteDirectories(cleanableDirectories);
}
function deleteDirectories(directoryPaths) {
    const promises = [];
    for (const directoryPath of directoryPaths) {
        promises.push(helpers_1.rimRafAsync(directoryPath));
    }
    return Promise.all(promises);
}
function processRemoveFile(changedFile) {
    // delete any destination files that match the source file
    const list = copyFilePathCache.get(changedFile.filePath) || [];
    copyFilePathCache.delete(changedFile.filePath);
    const promises = [];
    const deletedFilePaths = [];
    list.forEach(copiedFile => {
        const promise = helpers_1.unlinkAsync(copiedFile.absoluteDestPath);
        promises.push(promise);
        promise.catch(err => {
            if (err && err.message && err.message.indexOf('ENOENT') >= 0) {
                logger_1.Logger.warn(`Failed to delete ${copiedFile.absoluteDestPath} because it doesn't exist`);
                return;
            }
            throw err;
        });
        deletedFilePaths.push(copiedFile.absoluteDestPath);
    });
    events_1.emit(events_1.EventType.FileDelete, deletedFilePaths);
    return Promise.all(promises).catch(err => {
    });
}
function processRemoveDir(changedFile) {
    // remove any files from the cache where the dirname equals the provided path
    const keysToRemove = [];
    const directoriesToRemove = new Set();
    copyFilePathCache.forEach((copiedFiles, filePath) => {
        if (path_1.dirname(filePath) === changedFile.filePath) {
            keysToRemove.push(filePath);
            copiedFiles.forEach(copiedFile => directoriesToRemove.add(path_1.dirname(copiedFile.absoluteDestPath)));
        }
    });
    keysToRemove.forEach(keyToRemove => copyFilePathCache.delete(keyToRemove));
    // the entries are removed from the cache, now just rim raf the directoryPath
    const promises = [];
    directoriesToRemove.forEach(directoryToRemove => {
        promises.push(helpers_1.rimRafAsync(directoryToRemove));
    });
    events_1.emit(events_1.EventType.DirectoryDelete, Array.from(directoriesToRemove));
    return Promise.all(promises);
}
function cacheCopyData(copyObject) {
    let list = copyFilePathCache.get(copyObject.absoluteSourcePath);
    if (!list) {
        list = [];
    }
    list.push(copyObject);
    copyFilePathCache.set(copyObject.absoluteSourcePath, list);
}
function getFilesPathsForConfig(copyConfigKeys, copyConfig) {
    // execute the glob functions to determine what files match each glob
    const srcToResultsMap = new Map();
    const promises = [];
    copyConfigKeys.forEach(key => {
        const copyOptions = copyConfig[key];
        if (copyOptions && copyOptions.src) {
            const promise = glob_util_1.globAll(copyOptions.src);
            promises.push(promise);
            promise.then(globResultList => {
                srcToResultsMap.set(key, globResultList);
            });
        }
    });
    return Promise.all(promises).then(() => {
        return srcToResultsMap;
    });
}
function populateFileAndDirectoryInfo(resultMap, copyConfig, toCopyList, directoriesToCreate) {
    resultMap.forEach((globResults, dictionaryKey) => {
        globResults.forEach(globResult => {
            // get the relative path from the of each file from the glob
            const relativePath = path_1.relative(globResult.base, globResult.absolutePath);
            // append the relative path to the dest
            const destFileName = path_1.resolve(path_1.join(copyConfig[dictionaryKey].dest, relativePath));
            // store the file information
            toCopyList.push({
                absoluteSourcePath: globResult.absolutePath,
                absoluteDestPath: destFileName
            });
            const directoryToCreate = path_1.dirname(destFileName);
            directoriesToCreate.add(directoryToCreate);
        });
    });
}
function cleanConfigContent(dictionaryKeys, copyConfig, context) {
    dictionaryKeys.forEach(key => {
        const copyOption = copyConfig[key];
        if (copyOption && copyOption.src && copyOption.src.length) {
            const cleanedUpSrc = config_1.replacePathVars(context, copyOption.src);
            copyOption.src = cleanedUpSrc;
            const cleanedUpDest = config_1.replacePathVars(context, copyOption.dest);
            copyOption.dest = cleanedUpDest;
        }
    });
}
function copyConfigToWatchConfig(context) {
    if (!context) {
        context = config_1.generateContext(context);
    }
    const configFile = config_1.getUserConfigFile(context, exports.taskInfo, '');
    const copyConfig = config_1.fillConfigDefaults(configFile, exports.taskInfo.defaultConfigFile);
    let results = [];
    for (const key of Object.keys(copyConfig)) {
        if (copyConfig[key] && copyConfig[key].src) {
            const list = glob_util_1.generateGlobTasks(copyConfig[key].src, {});
            results = results.concat(list);
        }
    }
    const paths = [];
    let ignored = [];
    for (const result of results) {
        paths.push(result.pattern);
        if (result.opts && result.opts.ignore) {
            ignored = ignored.concat(result.opts.ignore);
        }
    }
    return {
        paths: paths,
        options: {
            ignored: ignored
        },
        callback: watch_1.copyUpdate
    };
}
exports.copyConfigToWatchConfig = copyConfigToWatchConfig;
exports.taskInfo = {
    fullArg: '--copy',
    shortArg: '-y',
    envVar: 'IONIC_COPY',
    packageConfig: 'ionic_copy',
    defaultConfigFile: 'copy.config'
};
