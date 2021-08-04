"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSystemCompilerHostInstance = void 0;
const compiler_host_1 = require("./compiler-host");
const hybrid_file_system_factory_1 = require("../util/hybrid-file-system-factory");
let instance = null;
function getFileSystemCompilerHostInstance(options) {
    if (!instance) {
        instance = new compiler_host_1.FileSystemCompilerHost(options, hybrid_file_system_factory_1.getInstance(false));
    }
    return instance;
}
exports.getFileSystemCompilerHostInstance = getFileSystemCompilerHostInstance;
