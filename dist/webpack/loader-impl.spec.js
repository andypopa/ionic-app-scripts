"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const loader = require("./loader-impl");
const helpers = require("../util/helpers");
function getMockContext() {
    return {
        fileCache: getMockFileCache()
    };
}
function getMockFileCache() {
    return {
        get: () => { },
        set: () => { }
    };
}
function getMockWebpackObject(resourcePath) {
    return {
        cacheable: () => { },
        async: () => { },
        resourcePath: resourcePath
    };
}
describe('webpack loader', () => {
    it('should callback with file and original source map provided', (done) => {
        // arrange
        const mockContext = getMockContext();
        const mockSourceMap = {};
        const sourceString = 'sourceString';
        const fakePath = path_1.join(process.cwd(), 'some', 'path', 'content.js');
        const fakeContent = 'SomeFileContent';
        const mockWebpackObject = getMockWebpackObject(fakePath);
        const spy = jasmine.createSpy('mock webpack callback');
        spy.and.callFake(() => {
            assertFunction();
        });
        spyOn(mockWebpackObject, mockWebpackObject.cacheable.name);
        spyOn(mockWebpackObject, mockWebpackObject.async.name).and.returnValue(spy);
        spyOn(helpers, helpers.getContext.name).and.returnValue(mockContext);
        spyOn(helpers, helpers.readAndCacheFile.name).and.returnValue(Promise.resolve(fakeContent));
        spyOn(mockContext.fileCache, mockContext.fileCache.get.name).and.returnValue({
            path: fakePath,
            content: fakeContent
        });
        // act
        loader.webpackLoader(sourceString, mockSourceMap, mockWebpackObject);
        // assert
        const assertFunction = () => {
            expect(helpers.readAndCacheFile).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith(null, fakeContent, mockSourceMap);
            done();
        };
    });
    it('should callback with file and map loaded from file cache', (done) => {
        // arrange
        const mockContext = getMockContext();
        const mockSourceMap = {};
        const sourceString = 'sourceString';
        const fakePath = path_1.join(process.cwd(), 'some', 'path', 'content.js');
        const fakeContent = `{"test": "test"}`;
        const mockWebpackObject = getMockWebpackObject(fakePath);
        const spy = jasmine.createSpy('mock webpack callback');
        spy.and.callFake(() => {
            assertFunction();
        });
        spyOn(mockWebpackObject, mockWebpackObject.cacheable.name);
        spyOn(mockWebpackObject, mockWebpackObject.async.name).and.returnValue(spy);
        spyOn(helpers, helpers.getContext.name).and.returnValue(mockContext);
        spyOn(helpers, helpers.readAndCacheFile.name).and.returnValue(Promise.resolve(fakeContent));
        const fileCacheSpy = spyOn(mockContext.fileCache, mockContext.fileCache.get.name).and.returnValue({
            path: fakePath,
            content: fakeContent
        });
        // act
        loader.webpackLoader(sourceString, mockSourceMap, mockWebpackObject);
        // assert
        const assertFunction = () => {
            expect(fileCacheSpy).toHaveBeenCalledTimes(2);
            expect(fileCacheSpy.calls.first().args[0]).toEqual(fakePath);
            expect(fileCacheSpy.calls.mostRecent().args[0]).toEqual(fakePath + '.map');
            expect(spy.calls.mostRecent().args[0]).toEqual(null);
            expect(spy.calls.mostRecent().args[1]).toEqual(fakeContent);
            expect(spy.calls.mostRecent().args[2]).not.toEqual(mockSourceMap);
            done();
        };
    });
    it('should callback with error when can\'t load file from disk', (done) => {
        // arrange
        const cantReadFileError = 'Failed to read file from disk';
        const mockContext = getMockContext();
        const mockSourceMap = {};
        const sourceString = 'sourceString';
        const fakePath = path_1.join(process.cwd(), 'some', 'path', 'content.js');
        const mockWebpackObject = getMockWebpackObject(fakePath);
        const spy = jasmine.createSpy('mock webpack callback');
        spy.and.callFake(() => {
            assertFunction();
        });
        spyOn(mockWebpackObject, mockWebpackObject.cacheable.name);
        spyOn(mockWebpackObject, mockWebpackObject.async.name).and.returnValue(spy);
        spyOn(helpers, helpers.getContext.name).and.returnValue(mockContext);
        spyOn(mockContext.fileCache, mockContext.fileCache.get.name).and.returnValue(null);
        spyOn(mockContext.fileCache, mockContext.fileCache.set.name);
        spyOn(helpers, helpers.readAndCacheFile.name).and.returnValue(Promise.reject(new Error(cantReadFileError)));
        // assert
        const assertFunction = () => {
            expect(spy.calls.mostRecent().args[0]).toBeTruthy();
            expect(spy.calls.mostRecent().args[0].message).toEqual(cantReadFileError);
            done();
        };
        // act
        return loader.webpackLoader(sourceString, mockSourceMap, mockWebpackObject);
    });
    it('should callback with content from disk', (done) => {
        // arrange
        const mockContext = getMockContext();
        const mockSourceMap = {};
        const sourceString = 'sourceString';
        const fakePath = path_1.join(process.cwd(), 'some', 'path', 'content.js');
        const fakeContent = `{"test": "test"}`;
        const mockWebpackObject = getMockWebpackObject(fakePath);
        const callbackSpy = jasmine.createSpy('mock webpack callback');
        callbackSpy.and.callFake(() => {
            assertFunction();
        });
        spyOn(mockWebpackObject, mockWebpackObject.cacheable.name);
        spyOn(mockWebpackObject, mockWebpackObject.async.name).and.returnValue(callbackSpy);
        spyOn(helpers, helpers.getContext.name).and.returnValue(mockContext);
        spyOn(mockContext.fileCache, mockContext.fileCache.set.name);
        const readFileSpy = spyOn(helpers, helpers.readAndCacheFile.name).and.returnValue(Promise.resolve(fakeContent));
        spyOn(mockContext.fileCache, mockContext.fileCache.get.name).and.returnValue({
            path: fakePath,
            content: fakeContent
        });
        // act
        loader.webpackLoader(sourceString, mockSourceMap, mockWebpackObject);
        // assert
        const assertFunction = () => {
            expect(readFileSpy).toHaveBeenCalledTimes(2);
            expect(readFileSpy.calls.first().args[0]).toEqual(fakePath);
            expect(readFileSpy.calls.mostRecent().args[0]).toEqual(fakePath + '.map');
            expect(callbackSpy.calls.mostRecent().args[0]).toEqual(null);
            expect(callbackSpy.calls.mostRecent().args[1]).toEqual(fakeContent);
            expect(callbackSpy.calls.mostRecent().args[2]).toBeTruthy();
            done();
        };
    });
});
