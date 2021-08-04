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
exports.purgeSourceMapsIfNeeded = exports.copySourcemaps = void 0;
const path_1 = require("path");
const Constants = require("./constants");
const helpers_1 = require("./helpers");
function copySourcemaps(context, shouldPurge) {
    return __awaiter(this, void 0, void 0, function* () {
        const copyBeforePurge = helpers_1.getBooleanPropertyValue(Constants.ENV_VAR_MOVE_SOURCE_MAPS);
        if (copyBeforePurge) {
            yield helpers_1.mkDirpAsync(context.sourcemapDir);
        }
        const fileNames = yield helpers_1.readDirAsync(context.buildDir);
        // only include js source maps
        const sourceMaps = fileNames.filter(fileName => fileName.endsWith('.map'));
        const toCopy = sourceMaps.filter(fileName => fileName.indexOf('vendor.js') < 0 && fileName.endsWith('.js.map'));
        const toCopyFullPaths = toCopy.map(fileName => path_1.join(context.buildDir, fileName));
        const toPurge = sourceMaps.map(sourceMap => path_1.join(context.buildDir, sourceMap));
        const copyFilePromises = [];
        if (copyBeforePurge) {
            for (const fullPath of toCopyFullPaths) {
                const fileName = path_1.basename(fullPath);
                copyFilePromises.push(helpers_1.copyFileAsync(fullPath, path_1.join(context.sourcemapDir, fileName)));
            }
        }
        yield Promise.all(copyFilePromises);
        // okay cool, all of the files have been copied over, so go ahead and blow them all away
        const purgeFilePromises = [];
        if (shouldPurge) {
            for (const fullPath of toPurge) {
                purgeFilePromises.push(helpers_1.unlinkAsync(fullPath));
            }
        }
        return yield Promise.all(purgeFilePromises);
    });
}
exports.copySourcemaps = copySourcemaps;
function purgeSourceMapsIfNeeded(context) {
    if (helpers_1.getBooleanPropertyValue(Constants.ENV_VAR_GENERATE_SOURCE_MAP)) {
        // keep the source maps and just return
        return copySourcemaps(context, false);
    }
    return copySourcemaps(context, true);
}
exports.purgeSourceMapsIfNeeded = purgeSourceMapsIfNeeded;
