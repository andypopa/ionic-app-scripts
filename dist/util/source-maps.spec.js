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
const path_1 = require("path");
const Constants = require("./constants");
const sourceMaps = require("./source-maps");
const helpers = require("./helpers");
describe('source maps', () => {
    describe('purgeSourceMapsIfNeeded', () => {
        it('should copy files first, then purge the files', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(helpers, helpers.getBooleanPropertyValue.name).and.callFake((argument) => {
                if (argument === Constants.ENV_VAR_MOVE_SOURCE_MAPS) {
                    return true;
                }
            });
            spyOn(helpers, helpers.mkDirpAsync.name).and.returnValue(Promise.resolve());
            const knownFileNames = ['0.js', '0.js.map', '1.js', '1.js.map', 'main.js', 'main.js.map', 'vendor.js', 'vendor.js.map', 'main.css', 'polyfills.js', 'sw-toolbox.js', 'main.css', 'main.css.map'];
            spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(knownFileNames));
            const context = {
                sourcemapDir: path_1.join(process.cwd(), 'sourceMapDir'),
                buildDir: path_1.join(process.cwd(), 'www', 'build')
            };
            const copyFileSpy = spyOn(helpers, helpers.copyFileAsync.name).and.returnValue(Promise.resolve());
            const unlinkFileSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());
            const result = yield sourceMaps.copySourcemaps(context, true);
            expect(helpers.mkDirpAsync).toHaveBeenCalledTimes(1);
            expect(helpers.mkDirpAsync).toHaveBeenCalledWith(context.sourcemapDir);
            expect(helpers.readDirAsync).toHaveBeenCalledTimes(1);
            expect(helpers.readDirAsync).toHaveBeenLastCalledWith(context.buildDir);
            expect(helpers.copyFileAsync).toHaveBeenCalledTimes(3);
            expect(copyFileSpy.calls.all()[0].args[0]).toEqual(path_1.join(context.buildDir, '0.js.map'));
            expect(copyFileSpy.calls.all()[0].args[1]).toEqual(path_1.join(context.sourcemapDir, '0.js.map'));
            expect(copyFileSpy.calls.all()[1].args[0]).toEqual(path_1.join(context.buildDir, '1.js.map'));
            expect(copyFileSpy.calls.all()[1].args[1]).toEqual(path_1.join(context.sourcemapDir, '1.js.map'));
            expect(copyFileSpy.calls.all()[2].args[0]).toEqual(path_1.join(context.buildDir, 'main.js.map'));
            expect(copyFileSpy.calls.all()[2].args[1]).toEqual(path_1.join(context.sourcemapDir, 'main.js.map'));
            expect(helpers.unlinkAsync).toHaveBeenCalledTimes(5);
            expect(unlinkFileSpy.calls.all()[0].args[0]).toEqual(path_1.join(context.buildDir, '0.js.map'));
            expect(unlinkFileSpy.calls.all()[1].args[0]).toEqual(path_1.join(context.buildDir, '1.js.map'));
            expect(unlinkFileSpy.calls.all()[2].args[0]).toEqual(path_1.join(context.buildDir, 'main.js.map'));
            expect(unlinkFileSpy.calls.all()[3].args[0]).toEqual(path_1.join(context.buildDir, 'vendor.js.map'));
            expect(unlinkFileSpy.calls.all()[4].args[0]).toEqual(path_1.join(context.buildDir, 'main.css.map'));
        }));
        it('should copy the files but not purge them after', () => __awaiter(void 0, void 0, void 0, function* () {
            spyOn(helpers, helpers.getBooleanPropertyValue.name).and.callFake((argument) => {
                if (argument === Constants.ENV_VAR_MOVE_SOURCE_MAPS) {
                    return true;
                }
            });
            spyOn(helpers, helpers.mkDirpAsync.name).and.returnValue(Promise.resolve());
            const knownFileNames = ['0.js', '0.js.map', '1.js', '1.js.map', 'main.js', 'main.js.map', 'vendor.js', 'vendor.js.map', 'main.css', 'polyfills.js', 'sw-toolbox.js', 'main.css', 'main.css.map'];
            spyOn(helpers, helpers.readDirAsync.name).and.returnValue(Promise.resolve(knownFileNames));
            const context = {
                sourcemapDir: path_1.join(process.cwd(), 'sourceMapDir'),
                buildDir: path_1.join(process.cwd(), 'www', 'build')
            };
            const copyFileSpy = spyOn(helpers, helpers.copyFileAsync.name).and.returnValue(Promise.resolve());
            const unlinkFileSpy = spyOn(helpers, helpers.unlinkAsync.name).and.returnValue(Promise.resolve());
            const result = yield sourceMaps.copySourcemaps(context, false);
            expect(helpers.mkDirpAsync).toHaveBeenCalledTimes(1);
            expect(helpers.mkDirpAsync).toHaveBeenCalledWith(context.sourcemapDir);
            expect(helpers.readDirAsync).toHaveBeenCalledTimes(1);
            expect(helpers.readDirAsync).toHaveBeenLastCalledWith(context.buildDir);
            expect(helpers.copyFileAsync).toHaveBeenCalledTimes(3);
            expect(copyFileSpy.calls.all()[0].args[0]).toEqual(path_1.join(context.buildDir, '0.js.map'));
            expect(copyFileSpy.calls.all()[0].args[1]).toEqual(path_1.join(context.sourcemapDir, '0.js.map'));
            expect(copyFileSpy.calls.all()[1].args[0]).toEqual(path_1.join(context.buildDir, '1.js.map'));
            expect(copyFileSpy.calls.all()[1].args[1]).toEqual(path_1.join(context.sourcemapDir, '1.js.map'));
            expect(copyFileSpy.calls.all()[2].args[0]).toEqual(path_1.join(context.buildDir, 'main.js.map'));
            expect(copyFileSpy.calls.all()[2].args[1]).toEqual(path_1.join(context.sourcemapDir, 'main.js.map'));
            expect(helpers.unlinkAsync).toHaveBeenCalledTimes(0);
        }));
    });
});
