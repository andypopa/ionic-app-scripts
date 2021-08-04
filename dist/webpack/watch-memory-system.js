"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchMemorySystem = void 0;
const path_1 = require("path");
const events_1 = require("../util/events");
const logger_1 = require("../logger/logger");
class WatchMemorySystem {
    constructor(fileCache, srcDir) {
        this.fileCache = fileCache;
        this.srcDir = srcDir;
        this.lastWatchEventTimestamp = Date.now();
    }
    close() {
        this.isListening = false;
    }
    pause() {
        this.isListening = false;
    }
    watch(filePathsBeingWatched, dirPaths, missing, startTime, options, aggregatedCallback, immediateCallback) {
        this.filePathsBeingWatched = filePathsBeingWatched;
        this.dirPaths = dirPaths;
        this.missing = missing;
        this.startTime = startTime;
        this.options = options;
        this.immediateCallback = immediateCallback;
        this.aggregatedCallback = aggregatedCallback;
        if (!this.isListening) {
            this.startListening();
        }
        return {
            pause: this.pause,
            close: this.close
        };
    }
    startListening() {
        this.isListening = true;
        events_1.on(events_1.EventType.WebpackFilesChanged, () => {
            this.changes = new Set();
            const filePaths = this.fileCache.getAll().filter(file => file.timestamp >= this.lastWatchEventTimestamp && file.path.startsWith(this.srcDir) && path_1.extname(file.path) === '.ts').map(file => file.path);
            logger_1.Logger.debug('filePaths: ', filePaths);
            this.lastWatchEventTimestamp = Date.now();
            this.processChanges(filePaths);
        });
    }
    processChanges(filePaths) {
        this.immediateCallback(filePaths[0], Date.now());
        for (const path of filePaths) {
            this.changes.add(path);
        }
        // don't bother waiting around, just call doneAggregating right away.
        // keep it as a function in case we need to wait via setTimeout a bit in the future
        this.doneAggregating(this.changes);
    }
    doneAggregating(changes) {
        this.isAggregating = false;
        // process the changes
        const filePaths = Array.from(changes);
        const files = filePaths.filter(filePath => this.filePathsBeingWatched.indexOf(filePath) >= 0).sort();
        const dirs = filePaths.filter(filePath => this.dirPaths.indexOf(filePath) >= 0).sort();
        const missing = filePaths.filter(filePath => this.missing.indexOf(filePath) >= 0).sort();
        const times = this.getTimes(this.filePathsBeingWatched, this.startTime, this.fileCache);
        this.aggregatedCallback(null, files, dirs, missing, times, times);
    }
    getTimes(allFiles, startTime, fileCache) {
        let times = {};
        for (const filePath of allFiles) {
            const file = fileCache.get(filePath);
            if (file) {
                times[filePath] = file.timestamp;
            }
            else {
                times[filePath] = startTime;
            }
        }
        return times;
    }
}
exports.WatchMemorySystem = WatchMemorySystem;
