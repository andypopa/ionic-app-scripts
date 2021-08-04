"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preprocessUpdate = exports.preprocess = void 0;
const logger_1 = require("./logger/logger");
const errors_1 = require("./util/errors");
const bundle_components_1 = require("./core/bundle-components");
function preprocess(context) {
    const logger = new logger_1.Logger(`preprocess`);
    return preprocessWorker(context).then(() => {
        logger.finish();
    })
        .catch((err) => {
        const error = new errors_1.BuildError(err.message);
        error.isFatal = true;
        throw logger.fail(error);
    });
}
exports.preprocess = preprocess;
function preprocessWorker(context) {
    const bundlePromise = bundle_components_1.bundleCoreComponents(context);
    return Promise.all([bundlePromise]);
}
function preprocessUpdate(changedFiles, context) {
    const promises = [];
    if (changedFiles.some(cf => cf.ext === '.scss')) {
        promises.push(bundle_components_1.bundleCoreComponents(context));
    }
    return Promise.all(promises);
}
exports.preprocessUpdate = preprocessUpdate;
