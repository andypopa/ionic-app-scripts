"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJsOutputDest = exports.buildJsSourceMaps = exports.bundleUpdate = exports.bundle = void 0;
const errors_1 = require("./util/errors");
const webpack_1 = require("./webpack");
function bundle(context, configFile) {
    return bundleWorker(context, configFile)
        .catch((err) => {
        throw new errors_1.BuildError(err);
    });
}
exports.bundle = bundle;
function bundleWorker(context, configFile) {
    return webpack_1.webpack(context, configFile);
}
function bundleUpdate(changedFiles, context) {
    return webpack_1.webpackUpdate(changedFiles, context)
        .catch(err => {
        if (err instanceof errors_1.IgnorableError) {
            throw err;
        }
        throw new errors_1.BuildError(err);
    });
}
exports.bundleUpdate = bundleUpdate;
function buildJsSourceMaps(context) {
    const webpackConfig = webpack_1.getWebpackConfig(context, null);
    return !!(webpackConfig.devtool && webpackConfig.devtool.length > 0);
}
exports.buildJsSourceMaps = buildJsSourceMaps;
function getJsOutputDest(context) {
    return webpack_1.getOutputDest(context);
}
exports.getJsOutputDest = getJsOutputDest;
