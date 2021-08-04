"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridFileSystem = void 0;
const path_1 = require("path");
const virtual_file_utils_1 = require("./virtual-file-utils");
class HybridFileSystem {
    constructor(fileCache) {
        this.fileCache = fileCache;
        this.filesStats = {};
        this.directoryStats = {};
    }
    setInputFileSystem(fs) {
        this.inputFileSystem = fs;
    }
    setOutputFileSystem(fs) {
        this.outputFileSystem = fs;
    }
    setWriteToDisk(write) {
        this.writeToDisk = write;
    }
    isSync() {
        return this.inputFileSystem.isSync();
    }
    stat(path, callback) {
        // first check the fileStats
        const fileStat = this.filesStats[path];
        if (fileStat) {
            return callback(null, fileStat);
        }
        // then check the directory stats
        const directoryStat = this.directoryStats[path];
        if (directoryStat) {
            return callback(null, directoryStat);
        }
        // fallback to list
        return this.inputFileSystem.stat(path, callback);
    }
    readdir(path, callback) {
        return this.inputFileSystem.readdir(path, callback);
    }
    readJson(path, callback) {
        return this.inputFileSystem.readJson(path, callback);
    }
    readlink(path, callback) {
        return this.inputFileSystem.readlink(path, (err, response) => {
            callback(err, response);
        });
    }
    purge(pathsToPurge) {
        if (this.fileCache) {
            for (const path of pathsToPurge) {
                this.fileCache.remove(path);
            }
        }
    }
    readFile(path, callback) {
        const file = this.fileCache.get(path);
        if (file) {
            callback(null, new Buffer(file.content));
            return;
        }
        return this.inputFileSystem.readFile(path, callback);
    }
    addVirtualFile(filePath, fileContent) {
        this.fileCache.set(filePath, { path: filePath, content: fileContent });
        const fileStats = new virtual_file_utils_1.VirtualFileStats(filePath, fileContent);
        this.filesStats[filePath] = fileStats;
        const directoryPath = path_1.dirname(filePath);
        const directoryStats = new virtual_file_utils_1.VirtualDirStats(directoryPath);
        this.directoryStats[directoryPath] = directoryStats;
    }
    getFileContent(filePath) {
        const file = this.fileCache.get(filePath);
        if (file) {
            return file.content;
        }
        return null;
    }
    getDirectoryStats(path) {
        return this.directoryStats[path];
    }
    getSubDirs(directoryPath) {
        return Object.keys(this.directoryStats)
            .filter(filePath => path_1.dirname(filePath) === directoryPath)
            .map(filePath => path_1.basename(directoryPath));
    }
    getFileNamesInDirectory(directoryPath) {
        return Object.keys(this.filesStats).filter(filePath => path_1.dirname(filePath) === directoryPath).map(filePath => path_1.basename(filePath));
    }
    getAllFileStats() {
        return this.filesStats;
    }
    getAllDirStats() {
        return this.directoryStats;
    }
    mkdirp(filePath, callback) {
        if (this.writeToDisk) {
            return this.outputFileSystem.mkdirp(filePath, callback);
        }
        callback();
    }
    mkdir(filePath, callback) {
        if (this.writeToDisk) {
            return this.outputFileSystem.mkdir(filePath, callback);
        }
        callback();
    }
    rmdir(filePath, callback) {
        if (this.writeToDisk) {
            return this.outputFileSystem.rmdir(filePath, callback);
        }
        callback();
    }
    unlink(filePath, callback) {
        if (this.writeToDisk) {
            return this.outputFileSystem.unlink(filePath, callback);
        }
        callback();
    }
    join(dirPath, fileName) {
        return path_1.join(dirPath, fileName);
    }
    writeFile(filePath, fileContent, callback) {
        const stringContent = fileContent.toString();
        this.addVirtualFile(filePath, stringContent);
        if (this.writeToDisk) {
            return this.outputFileSystem.writeFile(filePath, fileContent, callback);
        }
        callback();
    }
}
exports.HybridFileSystem = HybridFileSystem;
