"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskInfo = exports.uglifyjsWorkerImpl = exports.uglifyjsWorker = exports.uglifyjs = void 0;
const Uglify = require("uglify-es");
const logger_1 = require("./logger/logger");
const config_1 = require("./util/config");
const errors_1 = require("./util/errors");
const helpers_1 = require("./util/helpers");
const worker_client_1 = require("./worker-client");
function uglifyjs(context, configFile) {
    configFile = config_1.getUserConfigFile(context, exports.taskInfo, configFile);
    const logger = new logger_1.Logger('uglify');
    return worker_client_1.runWorker('uglifyjs', 'uglifyjsWorker', context, configFile)
        .then(() => {
        logger.finish();
    })
        .catch((err) => {
        throw logger.fail(new errors_1.BuildError(err));
    });
}
exports.uglifyjs = uglifyjs;
function uglifyjsWorker(context, configFile) {
    const uglifyJsConfig = config_1.fillConfigDefaults(configFile, exports.taskInfo.defaultConfigFile);
    if (!context) {
        context = config_1.generateContext(context);
    }
    return uglifyjsWorkerImpl(context, uglifyJsConfig);
}
exports.uglifyjsWorker = uglifyjsWorker;
function uglifyjsWorkerImpl(context, uglifyJsConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const jsFilePaths = context.bundledFilePaths.filter(bundledFilePath => bundledFilePath.endsWith('.js'));
            const promises = jsFilePaths.map(filePath => {
                const sourceMapPath = filePath + '.map';
                return runUglifyInternal(filePath, filePath, sourceMapPath, sourceMapPath, uglifyJsConfig);
            });
            return yield Promise.all(promises);
        }
        catch (ex) {
            // uglify has it's own strange error format
            const errorString = `${ex.message} in ${ex.filename} at line ${ex.line}, col ${ex.col}, pos ${ex.pos}`;
            throw new errors_1.BuildError(new Error(errorString));
        }
    });
}
exports.uglifyjsWorkerImpl = uglifyjsWorkerImpl;
function runUglifyInternal(sourceFilePath, destFilePath, sourceMapPath, destMapPath, configObject) {
    return __awaiter(this, void 0, void 0, function* () {
        const [sourceFileContent, sourceMapContent] = yield Promise.all([helpers_1.readFileAsync(sourceFilePath), helpers_1.readFileAsync(sourceMapPath)]);
        const uglifyConfig = Object.assign({}, configObject, {
            sourceMap: {
                content: sourceMapContent
            }
        });
        const result = Uglify.minify(sourceFileContent, uglifyConfig);
        if (result.error) {
            throw new errors_1.BuildError(`Uglify failed: ${result.error.message}`);
        }
        return Promise.all([helpers_1.writeFileAsync(destFilePath, result.code), helpers_1.writeFileAsync(destMapPath, result.map)]);
    });
}
exports.taskInfo = {
    fullArg: '--uglifyjs',
    shortArg: '-u',
    envVar: 'IONIC_UGLIFYJS',
    packageConfig: 'ionic_uglifyjs',
    defaultConfigFile: 'uglifyjs.config'
};
