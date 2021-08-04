"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFilesToDisk = exports.postprocess = void 0;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const logger_1 = require("./logger/logger");
const Constants = require("./util/constants");
const helpers_1 = require("./util/helpers");
const inject_scripts_1 = require("./core/inject-scripts");
const source_maps_1 = require("./util/source-maps");
const remove_unused_fonts_1 = require("./optimization/remove-unused-fonts");
function postprocess(context) {
    const logger = new logger_1.Logger(`postprocess`);
    return postprocessWorker(context).then(() => {
        logger.finish();
    })
        .catch((err) => {
        throw logger.fail(err);
    });
}
exports.postprocess = postprocess;
function postprocessWorker(context) {
    const promises = [];
    promises.push(source_maps_1.purgeSourceMapsIfNeeded(context));
    promises.push(inject_scripts_1.updateIndexHtml(context));
    if (helpers_1.getBooleanPropertyValue(Constants.ENV_AOT_WRITE_TO_DISK)) {
        promises.push(writeFilesToDisk(context));
    }
    if (context.optimizeJs && helpers_1.getBooleanPropertyValue(Constants.ENV_PURGE_UNUSED_FONTS)) {
        promises.push(remove_unused_fonts_1.removeUnusedFonts(context));
    }
    return Promise.all(promises);
}
function writeFilesToDisk(context) {
    fs_extra_1.emptyDirSync(context.tmpDir);
    const files = context.fileCache.getAll();
    files.forEach(file => {
        const dirName = path_1.dirname(file.path);
        const relativePath = path_1.relative(process.cwd(), dirName);
        const tmpPath = path_1.join(context.tmpDir, relativePath);
        const fileName = path_1.basename(file.path);
        const fileToWrite = path_1.join(tmpPath, fileName);
        fs_extra_1.mkdirpSync(tmpPath);
        fs_extra_1.writeFileSync(fileToWrite, file.content);
    });
    return Promise.resolve();
}
exports.writeFilesToDisk = writeFilesToDisk;
