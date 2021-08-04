"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstance = void 0;
const hybrid_file_system_1 = require("./hybrid-file-system");
const helpers_1 = require("./helpers");
let instance = null;
function getInstance(writeToDisk) {
    if (!instance) {
        instance = new hybrid_file_system_1.HybridFileSystem(helpers_1.getContext().fileCache);
    }
    instance.setWriteToDisk(writeToDisk);
    return instance;
}
exports.getInstance = getInstance;
