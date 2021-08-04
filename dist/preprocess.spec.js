"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const preprocess = require("./preprocess");
const deeplink = require("./deep-linking");
const helpers = require("./util/helpers");
const globUtil = require("./util/glob-util");
describe('Preprocess Task', () => {
    describe('preprocess', () => {
        it('should call deepLink but not write files to disk', () => {
            // arrange
            const context = {
                optimizeJs: false
            };
            const mockDirName = path_1.join('some', 'fake', 'dir');
            const mockGlobResults = [];
            mockGlobResults.push({ absolutePath: mockDirName });
            mockGlobResults.push({ absolutePath: mockDirName + '2' });
            spyOn(deeplink, deeplink.deepLinking.name).and.returnValue(Promise.resolve());
            spyOn(helpers, helpers.getBooleanPropertyValue.name).and.returnValue(false);
            spyOn(helpers, helpers.getStringPropertyValue.name).and.returnValue(mockDirName);
            spyOn(globUtil, globUtil.globAll.name).and.returnValue(Promise.resolve(mockGlobResults));
            // act
            return preprocess.preprocess(context);
        });
    });
});
