"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemCompilerHost = void 0;
const path_1 = require("path");
const typescript_1 = require("typescript");
const typescript_utils_1 = require("../util/typescript-utils");
const logger_1 = require("../logger/logger");
class FileSystemCompilerHost {
    constructor(options, fileSystem, setParentNodes = true) {
        this.options = options;
        this.fileSystem = fileSystem;
        this.setParentNodes = setParentNodes;
        this.diskCompilerHost = typescript_1.createCompilerHost(this.options, this.setParentNodes);
    }
    fileExists(filePath) {
        filePath = path_1.normalize(filePath);
        const fileContent = this.fileSystem.getFileContent(filePath);
        if (fileContent) {
            return true;
        }
        return this.diskCompilerHost.fileExists(filePath);
    }
    readFile(filePath) {
        filePath = path_1.normalize(filePath);
        const fileContent = this.fileSystem.getFileContent(filePath);
        if (fileContent) {
            return fileContent;
        }
        return this.diskCompilerHost.readFile(filePath);
    }
    directoryExists(directoryPath) {
        directoryPath = path_1.normalize(directoryPath);
        const stats = this.fileSystem.getDirectoryStats(directoryPath);
        if (stats) {
            return true;
        }
        return this.diskCompilerHost.directoryExists(directoryPath);
    }
    getFiles(directoryPath) {
        directoryPath = path_1.normalize(directoryPath);
        return this.fileSystem.getFileNamesInDirectory(directoryPath);
    }
    getDirectories(directoryPath) {
        directoryPath = path_1.normalize(directoryPath);
        const subdirs = this.fileSystem.getSubDirs(directoryPath);
        let delegated;
        try {
            delegated = this.diskCompilerHost.getDirectories(directoryPath);
        }
        catch (e) {
            delegated = [];
        }
        return delegated.concat(subdirs);
    }
    getSourceFile(filePath, languageVersion, onError) {
        filePath = path_1.normalize(filePath);
        // we haven't created a source file for this yet, so try to use what's in memory
        const fileContentFromMemory = this.fileSystem.getFileContent(filePath);
        if (fileContentFromMemory) {
            const typescriptSourceFile = typescript_utils_1.getTypescriptSourceFile(filePath, fileContentFromMemory, languageVersion, this.setParentNodes);
            return typescriptSourceFile;
        }
        const diskSourceFile = this.diskCompilerHost.getSourceFile(filePath, languageVersion, onError);
        return diskSourceFile;
    }
    getCancellationToken() {
        return this.diskCompilerHost.getCancellationToken();
    }
    getDefaultLibFileName(options) {
        return this.diskCompilerHost.getDefaultLibFileName(options);
    }
    writeFile(fileName, data, writeByteOrderMark, onError) {
        fileName = path_1.normalize(fileName);
        logger_1.Logger.debug(`[NgcCompilerHost] writeFile: adding ${fileName} to virtual file system`);
        this.fileSystem.addVirtualFile(fileName, data);
    }
    getCurrentDirectory() {
        return this.diskCompilerHost.getCurrentDirectory();
    }
    getCanonicalFileName(fileName) {
        return this.diskCompilerHost.getCanonicalFileName(fileName);
    }
    useCaseSensitiveFileNames() {
        return this.diskCompilerHost.useCaseSensitiveFileNames();
    }
    getNewLine() {
        return this.diskCompilerHost.getNewLine();
    }
}
exports.FileSystemCompilerHost = FileSystemCompilerHost;
