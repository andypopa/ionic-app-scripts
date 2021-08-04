"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minifyCss = exports.minifyJs = exports.minify = void 0;
const cleancss_1 = require("./cleancss");
const logger_1 = require("./logger/logger");
const uglifyjs_1 = require("./uglifyjs");
function minify(context) {
    const logger = new logger_1.Logger('minify');
    return minifyWorker(context)
        .then(() => {
        logger.finish();
    })
        .catch(err => {
        throw logger.fail(err);
    });
}
exports.minify = minify;
function minifyWorker(context) {
    // both css and js minify can run at the same time
    return Promise.all([
        minifyJs(context),
        minifyCss(context)
    ]);
}
function minifyJs(context) {
    return runUglify(context);
}
exports.minifyJs = minifyJs;
function runUglify(context) {
    // uglify cannot handle ES2015, so convert it to ES5 before minifying (if needed)
    return uglifyjs_1.uglifyjs(context);
}
function minifyCss(context) {
    return cleancss_1.cleancss(context);
}
exports.minifyCss = minifyCss;
