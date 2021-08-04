"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const cleanCss = require("./cleancss");
const cleanCssFactory = require("./util/clean-css-factory");
const config = require("./util/config");
const helpers = require("./util/helpers");
const workerClient = require("./worker-client");
describe('clean css task', () => {
    describe('cleancss', () => {
        it('should return when the worker returns', () => {
            // arrange
            const context = {};
            const configFile = null;
            const spy = spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.resolve());
            // act
            return cleanCss.cleancss(context, null).then(() => {
                // assert
                expect(spy).toHaveBeenCalledWith('cleancss', 'cleancssWorker', context, configFile);
            });
        });
        it('should throw when the worker throws', () => {
            // arrange
            const context = {};
            const errorMessage = 'Simulating an error';
            spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.reject(new Error(errorMessage)));
            // act
            return cleanCss.cleancss(context, null).then(() => {
                throw new Error('Should never get here');
            }).catch((err) => {
                // assert
                expect(err.message).toEqual(errorMessage);
            });
        });
    });
    describe('cleancssworker', () => {
        it('should throw when reading the file throws', () => {
            const errorMessage = 'simulating an error';
            // arrange
            const context = { buildDir: 'www' };
            const cleanCssConfig = { sourceFileName: 'sourceFileName', destFileName: 'destFileName' };
            spyOn(config, config.generateContext.name).and.returnValue(context);
            spyOn(config, config.fillConfigDefaults.name).and.returnValue(cleanCssConfig);
            spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.reject(new Error(errorMessage)));
            // act
            return cleanCss.cleancssWorker(context, null).then(() => {
                throw new Error('Should never get here');
            }).catch((err) => {
                expect(err.message).toEqual(errorMessage);
            });
        });
        it('should return what writeFileAsync returns', () => {
            // arrange
            const context = { buildDir: 'www' };
            const cleanCssConfig = { sourceFileName: 'sourceFileName', destFileName: 'destFileName' };
            const fileContent = 'content';
            const minifiedContent = 'someContent';
            spyOn(config, config.generateContext.name).and.returnValue(context);
            spyOn(config, config.fillConfigDefaults.name).and.returnValue(cleanCssConfig);
            spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve(fileContent));
            spyOn(helpers, helpers.writeFileAsync.name).and.returnValue(Promise.resolve());
            spyOn(cleanCssFactory, cleanCssFactory.getCleanCssInstance.name).and.returnValue({
                minify: (content, cb) => {
                    cb(null, { styles: minifiedContent });
                }
            });
            // act
            return cleanCss.cleancssWorker(context, null).then(() => {
                // assert
                expect(config.generateContext).toHaveBeenCalledWith(context);
                expect(config.fillConfigDefaults).toHaveBeenCalledWith(null, cleanCss.taskInfo.defaultConfigFile);
                expect(helpers.readFileAsync).toHaveBeenCalledWith(path_1.join(context.buildDir, cleanCssConfig.sourceFileName));
                expect(helpers.writeFileAsync).toHaveBeenCalledWith(path_1.join(context.buildDir, cleanCssConfig.destFileName), minifiedContent);
            });
        });
    });
    describe('runCleanCss', () => {
        it('should reject when minification errors out', () => {
            // arrange
            const errorMessage = 'simulating an error';
            const configFile = { options: {} };
            const fileContent = 'fileContent';
            const destinationFilePath = 'filePath';
            const mockMinifier = {
                minify: () => { }
            };
            const minifySpy = spyOn(mockMinifier, mockMinifier.minify.name);
            spyOn(cleanCssFactory, cleanCssFactory.getCleanCssInstance.name).and.returnValue(mockMinifier);
            // act
            const promise = cleanCss.runCleanCss(configFile, fileContent, destinationFilePath);
            // call the callback from the spy's args
            const callback = minifySpy.calls.mostRecent().args[1];
            callback(new Error(errorMessage), null);
            return promise.then(() => {
                throw new Error('Should never get here');
            }).catch((err) => {
                // assert
                expect(err.message).toEqual(errorMessage);
            });
        });
        it('should reject when minification has one or more errors', () => {
            // arrange
            const configFile = { options: {} };
            const fileContent = 'fileContent';
            const minificationResponse = {
                errors: ['some error']
            };
            const destinationFilePath = 'filePath';
            const mockMinifier = {
                minify: () => { }
            };
            const minifySpy = spyOn(mockMinifier, mockMinifier.minify.name);
            spyOn(cleanCssFactory, cleanCssFactory.getCleanCssInstance.name).and.returnValue(mockMinifier);
            // act
            const promise = cleanCss.runCleanCss(configFile, fileContent, destinationFilePath);
            // call the callback from the spy's args
            const callback = minifySpy.calls.mostRecent().args[1];
            callback(null, minificationResponse);
            return promise.then(() => {
                throw new Error('Should never get here');
            }).catch((err) => {
                // assert
                expect(err.message).toEqual(minificationResponse.errors[0]);
            });
        });
        it('should return minified content', () => {
            const configFile = { options: {} };
            const fileContent = 'fileContent';
            let minifySpy = null;
            const minificationResponse = {
                styles: 'minifiedContent'
            };
            const destinationFilePath = 'filePath';
            const mockMinifier = {
                minify: () => { }
            };
            minifySpy = spyOn(mockMinifier, mockMinifier.minify.name);
            spyOn(cleanCssFactory, cleanCssFactory.getCleanCssInstance.name).and.returnValue(mockMinifier);
            // act
            const promise = cleanCss.runCleanCss(configFile, fileContent, destinationFilePath);
            // call the callback from the spy's args
            const callback = minifySpy.calls.mostRecent().args[1];
            callback(null, minificationResponse);
            return promise.then((result) => {
                expect(result).toEqual(minificationResponse.styles);
                expect(cleanCssFactory.getCleanCssInstance).toHaveBeenCalledWith(configFile.options);
                expect(minifySpy.calls.mostRecent().args[0]).toEqual(fileContent);
            });
        });
    });
});
