"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const deepLinking = require("./deep-linking");
const deeplinkUtils = require("./deep-linking/util");
const file_cache_1 = require("./util/file-cache");
const helpers = require("./util/helpers");
describe('Deep Linking task', () => {
    describe('deepLinkingWorkerImpl', () => {
        it('should not update app ngmodule when it has an existing deeplink config', () => {
            const appNgModulePath = path_1.join('some', 'fake', 'path', 'myApp', 'src', 'app', 'app.module.ts');
            const context = {
                fileCache: new file_cache_1.FileCache()
            };
            const knownFileContent = 'someFileContent';
            const knownDeepLinkString = 'someDeepLinkString';
            context.fileCache.set(appNgModulePath, { path: appNgModulePath, content: knownFileContent });
            spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(appNgModulePath);
            spyOn(helpers, helpers.readAndCacheFile.name).and.returnValue(Promise.resolve(knownFileContent));
            spyOn(deeplinkUtils, deeplinkUtils.hasExistingDeepLinkConfig.name).and.returnValue(true);
            const promise = deepLinking.deepLinkingWorkerImpl(context, null);
            return promise.then((results) => {
                expect(deeplinkUtils.hasExistingDeepLinkConfig).toHaveBeenCalled();
                expect(results.size).toEqual(0);
            });
        });
    });
});
