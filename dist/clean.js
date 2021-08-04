"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clean = void 0;
const errors_1 = require("./util/errors");
const fs_extra_1 = require("fs-extra");
const logger_1 = require("./logger/logger");
function clean(context) {
    return new Promise((resolve, reject) => {
        const logger = new logger_1.Logger('clean');
        try {
            logger_1.Logger.debug(`[Clean] clean: cleaning ${context.buildDir}`);
            fs_extra_1.emptyDirSync(context.buildDir);
            logger.finish();
        }
        catch (ex) {
            reject(logger.fail(new errors_1.BuildError(`Failed to clean directory ${context.buildDir} - ${ex.message}`)));
        }
        resolve();
    });
}
exports.clean = clean;
