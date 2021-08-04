"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
var build_1 = require("./build");
Object.defineProperty(exports, "build", { enumerable: true, get: function () { return build_1.build; } });
var bundle_1 = require("./bundle");
Object.defineProperty(exports, "bundle", { enumerable: true, get: function () { return bundle_1.bundle; } });
Object.defineProperty(exports, "bundleUpdate", { enumerable: true, get: function () { return bundle_1.bundleUpdate; } });
var clean_1 = require("./clean");
Object.defineProperty(exports, "clean", { enumerable: true, get: function () { return clean_1.clean; } });
var cleancss_1 = require("./cleancss");
Object.defineProperty(exports, "cleancss", { enumerable: true, get: function () { return cleancss_1.cleancss; } });
var copy_1 = require("./copy");
Object.defineProperty(exports, "copy", { enumerable: true, get: function () { return copy_1.copy; } });
Object.defineProperty(exports, "copyUpdate", { enumerable: true, get: function () { return copy_1.copyUpdate; } });
var lint_1 = require("./lint");
Object.defineProperty(exports, "lint", { enumerable: true, get: function () { return lint_1.lint; } });
var minify_1 = require("./minify");
Object.defineProperty(exports, "minify", { enumerable: true, get: function () { return minify_1.minify; } });
var ngc_1 = require("./ngc");
Object.defineProperty(exports, "ngc", { enumerable: true, get: function () { return ngc_1.ngc; } });
var sass_1 = require("./sass");
Object.defineProperty(exports, "sass", { enumerable: true, get: function () { return sass_1.sass; } });
Object.defineProperty(exports, "sassUpdate", { enumerable: true, get: function () { return sass_1.sassUpdate; } });
var serve_1 = require("./serve");
Object.defineProperty(exports, "serve", { enumerable: true, get: function () { return serve_1.serve; } });
var transpile_1 = require("./transpile");
Object.defineProperty(exports, "transpile", { enumerable: true, get: function () { return transpile_1.transpile; } });
var uglifyjs_1 = require("./uglifyjs");
Object.defineProperty(exports, "uglifyjs", { enumerable: true, get: function () { return uglifyjs_1.uglifyjs; } });
var watch_1 = require("./watch");
Object.defineProperty(exports, "watch", { enumerable: true, get: function () { return watch_1.watch; } });
Object.defineProperty(exports, "buildUpdate", { enumerable: true, get: function () { return watch_1.buildUpdate; } });
__exportStar(require("./util/config"), exports);
__exportStar(require("./util/helpers"), exports);
__exportStar(require("./util/interfaces"), exports);
__exportStar(require("./util/constants"), exports);
__exportStar(require("./generators"), exports);
var util_1 = require("./deep-linking/util");
Object.defineProperty(exports, "getDeepLinkData", { enumerable: true, get: function () { return util_1.getDeepLinkData; } });
const config_1 = require("./util/config");
const helpers_1 = require("./util/helpers");
const logger_1 = require("./logger/logger");
function run(task) {
    try {
        logger_1.Logger.info(`ionic-app-scripts ${helpers_1.getAppScriptsVersion()}`, 'cyan');
    }
    catch (e) { }
    try {
        const context = config_1.generateContext(null);
        helpers_1.setContext(context);
        require(`../dist/${task}`)[task](context).catch((err) => {
            errorLog(task, err);
        });
    }
    catch (e) {
        errorLog(task, e);
    }
}
exports.run = run;
function errorLog(task, e) {
    logger_1.Logger.error(`ionic-app-script task: "${task}"`);
    if (e && e.toString() !== 'Error') {
        logger_1.Logger.error(`${e}`);
    }
    if (e.stack) {
        logger_1.Logger.unformattedError(e.stack);
    }
    process.exit(1);
}
