"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const build = require("./build");
const interfaces_1 = require("./util/interfaces");
const file_cache_1 = require("./util/file-cache");
const watch = require("./watch");
describe('watch', () => {
    describe('runBuildUpdate', () => {
        it('should require transpile full build for html file add', () => {
            const files = [{
                    event: 'add',
                    filePath: 'file1.html',
                    ext: '.html'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresBuild);
        });
        it('should require transpile full build for html file change and not already successful bundle', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.html',
                    ext: '.html'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresBuild);
        });
        it('should require template update for html file change and already successful bundle', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.html',
                    ext: '.html'
                }];
            context.bundleState = interfaces_1.BuildState.SuccessfulBuild;
            watch.runBuildUpdate(context, files);
            expect(context.templateState).toEqual(interfaces_1.BuildState.RequiresUpdate);
        });
        it('should require sass update for ts file unlink', () => {
            const files = [{
                    event: 'unlink',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.sassState).toEqual(interfaces_1.BuildState.RequiresUpdate);
        });
        it('should require sass update for ts file add', () => {
            const files = [{
                    event: 'add',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.sassState).toEqual(interfaces_1.BuildState.RequiresUpdate);
        });
        it('should require sass update for scss file add', () => {
            const files = [{
                    event: 'add',
                    filePath: 'file1.scss',
                    ext: '.scss'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.sassState).toEqual(interfaces_1.BuildState.RequiresUpdate);
        });
        it('should require sass update for scss file change', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.scss',
                    ext: '.scss'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.sassState).toEqual(interfaces_1.BuildState.RequiresUpdate);
        });
        it('should require transpile full build for single ts add, but only bundle update when already successful bundle', () => {
            const files = [{
                    event: 'add',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }];
            context.bundleState = interfaces_1.BuildState.SuccessfulBuild;
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.bundleState).toEqual(interfaces_1.BuildState.RequiresUpdate);
        });
        it('should require transpile full build for single ts add', () => {
            const files = [{
                    event: 'add',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.bundleState).toEqual(interfaces_1.BuildState.RequiresBuild);
        });
        it('should require transpile full build for single ts change and not in file cache', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.bundleState).toEqual(interfaces_1.BuildState.RequiresBuild);
        });
        it('should require transpile update only and full bundle build for single ts change and already in file cache and hasnt already had successful bundle', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }];
            context.bundleState = interfaces_1.BuildState.SuccessfulBuild;
            const resolvedFilePath = path_1.resolve('file1.ts');
            context.fileCache.set(resolvedFilePath, { path: 'file1.ts', content: 'content' });
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresUpdate);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresUpdate);
            expect(context.bundleState).toEqual(interfaces_1.BuildState.RequiresUpdate);
        });
        it('should require transpile update only and bundle update for single ts change and already in file cache and bundle already successful', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }];
            const resolvedFilePath = path_1.resolve('file1.ts');
            context.fileCache.set(resolvedFilePath, { path: 'file1.ts', content: 'content' });
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresUpdate);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresUpdate);
            expect(context.bundleState).toEqual(interfaces_1.BuildState.RequiresBuild);
        });
        it('should require transpile full build for multiple ts changes', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.ts',
                    ext: '.ts'
                }, {
                    event: 'change',
                    filePath: 'file2.ts',
                    ext: '.ts'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.transpileState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.deepLinkState).toEqual(interfaces_1.BuildState.RequiresBuild);
            expect(context.bundleState).toEqual(interfaces_1.BuildState.RequiresBuild);
        });
        it('should not update bundle state if no transpile changes', () => {
            const files = [{
                    event: 'change',
                    filePath: 'file1.scss',
                    ext: '.scss'
                }];
            watch.runBuildUpdate(context, files);
            expect(context.bundleState).toEqual(undefined);
        });
        it('should do nothing if there are no changed files', () => {
            expect(watch.runBuildUpdate(context, [])).toEqual(null);
            expect(watch.runBuildUpdate(context, null)).toEqual(null);
        });
        let context;
        beforeEach(() => {
            context = {
                fileCache: new file_cache_1.FileCache()
            };
        });
    });
    describe('prepareWatcher', () => {
        it('should do nothing when options.ignored is a function', () => {
            const ignoreFn = function () { };
            const watcher = { options: { ignored: ignoreFn } };
            const context = { srcDir: '/some/src/' };
            watch.prepareWatcher(context, watcher);
            expect(watcher.options.ignored).toBe(ignoreFn);
        });
        it('should set replacePathVars when options.ignored is a string', () => {
            const watcher = { options: { ignored: path_1.join('{{SRC}}', '**', '*.spec.ts') } };
            const context = { srcDir: path_1.join(process.cwd(), 'some', 'src') };
            watch.prepareWatcher(context, watcher);
            expect(watcher.options.ignored).toEqual(path_1.join(process.cwd(), 'some', 'src', '**', '*.spec.ts'));
        });
        it('should set replacePathVars when options.ignored is an array of strings', () => {
            const watcher = { options: { ignored: [path_1.join('{{SRC}}', '**', '*.spec.ts'), path_1.join('{{SRC}}', 'index.html')] } };
            const context = { srcDir: path_1.join(process.cwd(), 'some', 'src') };
            watch.prepareWatcher(context, watcher);
            expect(watcher.options.ignored[0]).toEqual(path_1.join(process.cwd(), 'some', 'src', '**', '*.spec.ts'));
            expect(watcher.options.ignored[1]).toEqual(path_1.join(process.cwd(), 'some', 'src', 'index.html'));
        });
        it('should set replacePathVars when paths is an array', () => {
            const watcher = { paths: [
                    path_1.join('{{SRC}}', 'some', 'path1'),
                    path_1.join('{{SRC}}', 'some', 'path2')
                ] };
            const context = { srcDir: path_1.join(process.cwd(), 'some', 'src') };
            watch.prepareWatcher(context, watcher);
            expect(watcher.paths.length).toEqual(2);
            expect(watcher.paths[0]).toEqual(path_1.join(process.cwd(), 'some', 'src', 'some', 'path1'));
            expect(watcher.paths[1]).toEqual(path_1.join(process.cwd(), 'some', 'src', 'some', 'path2'));
        });
        it('should set replacePathVars when paths is a string', () => {
            const watcher = { paths: path_1.join('{{SRC}}', 'some', 'path') };
            const context = { srcDir: path_1.join(process.cwd(), 'some', 'src') };
            watch.prepareWatcher(context, watcher);
            expect(watcher.paths).toEqual(path_1.join(process.cwd(), 'some', 'src', 'some', 'path'));
        });
        it('should not set options.ignoreInitial if it was provided', () => {
            const watcher = { options: { ignoreInitial: false } };
            const context = {};
            watch.prepareWatcher(context, watcher);
            expect(watcher.options.ignoreInitial).toEqual(false);
        });
        it('should set options.ignoreInitial to true if it wasnt provided', () => {
            const watcher = { options: {} };
            const context = {};
            watch.prepareWatcher(context, watcher);
            expect(watcher.options.ignoreInitial).toEqual(true);
        });
        it('should not set options.cwd from context.rootDir if it was provided', () => {
            const watcher = { options: { cwd: '/my/cwd/' } };
            const context = { rootDir: '/my/root/dir/' };
            watch.prepareWatcher(context, watcher);
            expect(watcher.options.cwd).toEqual('/my/cwd/');
        });
        it('should set options.cwd from context.rootDir if it wasnt provided', () => {
            const watcher = {};
            const context = { rootDir: '/my/root/dir/' };
            watch.prepareWatcher(context, watcher);
            expect(watcher.options.cwd).toEqual(context.rootDir);
        });
        it('should create watcher options when not provided', () => {
            const watcher = {};
            const context = {};
            watch.prepareWatcher(context, watcher);
            expect(watcher.options).toBeDefined();
        });
    });
    describe('queueOrRunBuildUpdate', () => {
        it('should not queue a build when there isnt an active build', () => {
            const changedFileOne = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter.ts'
            };
            const changedFileTwo = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter2.ts'
            };
            const changedFiles = [changedFileOne, changedFileTwo];
            const context = {};
            spyOn(watch, watch.queueOrRunBuildUpdate.name).and.callThrough();
            spyOn(build, build.buildUpdate.name).and.returnValue(Promise.resolve());
            const promise = watch.queueOrRunBuildUpdate(changedFiles, context);
            return promise.then(() => {
                expect(watch.queueOrRunBuildUpdate).toHaveBeenCalledTimes(1);
                expect(build.buildUpdate).toHaveBeenCalledWith(changedFiles, context);
                expect(watch.buildUpdatePromise).toEqual(null);
                expect(watch.queuedChangedFileMap.size).toEqual(0);
            });
        });
        it('should not queue changes when subsequent build is called after the first build', () => {
            const changedFileOne = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter.ts'
            };
            const changedFileTwo = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter2.ts'
            };
            const changedFiles = [changedFileOne, changedFileTwo];
            const context = {};
            spyOn(watch, watch.queueOrRunBuildUpdate.name).and.callThrough();
            spyOn(build, build.buildUpdate.name).and.returnValue(Promise.resolve());
            const promise = watch.queueOrRunBuildUpdate(changedFiles, context);
            return promise.then(() => {
                expect(watch.queueOrRunBuildUpdate).toHaveBeenCalledTimes(1);
                expect(build.buildUpdate).toHaveBeenCalledWith(changedFiles, context);
                expect(watch.buildUpdatePromise).toEqual(null);
                expect(watch.queuedChangedFileMap.size).toEqual(0);
                return watch.queueOrRunBuildUpdate(changedFiles, context);
            }).then(() => {
                expect(watch.queueOrRunBuildUpdate).toHaveBeenCalledTimes(2);
                expect(build.buildUpdate).toHaveBeenCalledWith(changedFiles, context);
                expect(watch.buildUpdatePromise).toEqual(null);
                expect(watch.queuedChangedFileMap.size).toEqual(0);
                return watch.queueOrRunBuildUpdate(changedFiles, context);
            }).then(() => {
                expect(watch.queueOrRunBuildUpdate).toHaveBeenCalledTimes(3);
                expect(build.buildUpdate).toHaveBeenCalledWith(changedFiles, context);
                expect(watch.buildUpdatePromise).toEqual(null);
                expect(watch.queuedChangedFileMap.size).toEqual(0);
            });
        });
        it('should queue up changes when a build is active', () => {
            const changedFileOne = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter.ts'
            };
            const changedFileTwo = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter2.ts'
            };
            const changedFileThree = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter3.ts'
            };
            const changedFileFour = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter4.ts'
            };
            const changedFileFive = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter5.ts'
            };
            const changedFileSix = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter6.ts'
            };
            const originalChangedFiles = [changedFileOne, changedFileTwo];
            const secondSetOfChangedFiles = [changedFileThree, changedFileFour];
            const ThirdSetOfChangedFiles = [changedFileTwo, changedFileFour, changedFileFive, changedFileSix];
            const context = {};
            let firstPromiseResolve = null;
            const firstPromise = new Promise((resolve, reject) => {
                firstPromiseResolve = resolve;
            });
            spyOn(watch, watch.queueOrRunBuildUpdate.name).and.callThrough();
            const buildUpdateSpy = spyOn(build, build.buildUpdate.name).and.callFake((changedFiles, context) => {
                if (changedFiles === originalChangedFiles) {
                    return firstPromise;
                }
                else {
                    return Promise.resolve();
                }
            });
            // call the original
            expect(watch.buildUpdatePromise).toBeFalsy();
            const promise = watch.queueOrRunBuildUpdate(originalChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(0);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            // okay, call again and it should be queued now
            watch.queueOrRunBuildUpdate(secondSetOfChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(2);
            expect(watch.queuedChangedFileMap.get(changedFileThree.filePath)).toEqual(changedFileThree);
            expect(watch.queuedChangedFileMap.get(changedFileFour.filePath)).toEqual(changedFileFour);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            // okay, let's queue some more
            watch.queueOrRunBuildUpdate(ThirdSetOfChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(5);
            expect(watch.queuedChangedFileMap.get(changedFileTwo.filePath)).toEqual(changedFileTwo);
            expect(watch.queuedChangedFileMap.get(changedFileThree.filePath)).toEqual(changedFileThree);
            expect(watch.queuedChangedFileMap.get(changedFileFour.filePath)).toEqual(changedFileFour);
            expect(watch.queuedChangedFileMap.get(changedFileFive.filePath)).toEqual(changedFileFive);
            expect(watch.queuedChangedFileMap.get(changedFileSix.filePath)).toEqual(changedFileSix);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            firstPromiseResolve();
            return promise.then(() => {
                expect(watch.buildUpdatePromise).toBeFalsy();
                expect(watch.queuedChangedFileMap.size).toEqual(0);
                expect(build.buildUpdate).toHaveBeenCalledTimes(2);
                expect(buildUpdateSpy.calls.first().args[0]).toEqual(originalChangedFiles);
                expect(buildUpdateSpy.calls.first().args[1]).toEqual(context);
                expect(buildUpdateSpy.calls.mostRecent().args[0].length).toEqual(5);
                // make sure the array contains the elements that we expect it to
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileTwo)[0]).toEqual(changedFileTwo);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileThree)[0]).toEqual(changedFileThree);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileFour)[0]).toEqual(changedFileFour);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileFive)[0]).toEqual(changedFileFive);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileSix)[0]).toEqual(changedFileSix);
                expect(buildUpdateSpy.calls.mostRecent().args[1]).toEqual(context);
            });
        });
        it('should run buildUpdate on the queued files even if the first build update fails', () => {
            const changedFileOne = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter.ts'
            };
            const changedFileTwo = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter2.ts'
            };
            const changedFileThree = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter3.ts'
            };
            const changedFileFour = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter4.ts'
            };
            const changedFileFive = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter5.ts'
            };
            const changedFileSix = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter6.ts'
            };
            const originalChangedFiles = [changedFileOne, changedFileTwo];
            const secondSetOfChangedFiles = [changedFileThree, changedFileFour];
            const ThirdSetOfChangedFiles = [changedFileTwo, changedFileFour, changedFileFive, changedFileSix];
            const context = {};
            let firstPromiseReject = null;
            const firstPromise = new Promise((resolve, reject) => {
                firstPromiseReject = reject;
            });
            spyOn(watch, watch.queueOrRunBuildUpdate.name).and.callThrough();
            const buildUpdateSpy = spyOn(build, build.buildUpdate.name).and.callFake((changedFiles, context) => {
                if (changedFiles === originalChangedFiles) {
                    return firstPromise;
                }
                else {
                    return Promise.resolve();
                }
            });
            // call the original
            expect(watch.buildUpdatePromise).toBeFalsy();
            const promise = watch.queueOrRunBuildUpdate(originalChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(0);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            // okay, call again and it should be queued now
            watch.queueOrRunBuildUpdate(secondSetOfChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(2);
            expect(watch.queuedChangedFileMap.get(changedFileThree.filePath)).toEqual(changedFileThree);
            expect(watch.queuedChangedFileMap.get(changedFileFour.filePath)).toEqual(changedFileFour);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            // okay, let's queue some more
            watch.queueOrRunBuildUpdate(ThirdSetOfChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(5);
            expect(watch.queuedChangedFileMap.get(changedFileTwo.filePath)).toEqual(changedFileTwo);
            expect(watch.queuedChangedFileMap.get(changedFileThree.filePath)).toEqual(changedFileThree);
            expect(watch.queuedChangedFileMap.get(changedFileFour.filePath)).toEqual(changedFileFour);
            expect(watch.queuedChangedFileMap.get(changedFileFive.filePath)).toEqual(changedFileFive);
            expect(watch.queuedChangedFileMap.get(changedFileSix.filePath)).toEqual(changedFileSix);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            firstPromiseReject();
            return promise.then(() => {
                expect(watch.buildUpdatePromise).toBeFalsy();
                expect(watch.queuedChangedFileMap.size).toEqual(0);
                expect(build.buildUpdate).toHaveBeenCalledTimes(2);
                expect(buildUpdateSpy.calls.first().args[0]).toEqual(originalChangedFiles);
                expect(buildUpdateSpy.calls.first().args[1]).toEqual(context);
                expect(buildUpdateSpy.calls.mostRecent().args[0].length).toEqual(5);
                // make sure the array contains the elements that we expect it to
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileTwo)[0]).toEqual(changedFileTwo);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileThree)[0]).toEqual(changedFileThree);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileFour)[0]).toEqual(changedFileFour);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileFive)[0]).toEqual(changedFileFive);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileSix)[0]).toEqual(changedFileSix);
                expect(buildUpdateSpy.calls.mostRecent().args[1]).toEqual(context);
            });
        });
        it('should handle multiple queueing and unqueuing events aka advanced test', () => {
            const changedFileOne = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter.ts'
            };
            const changedFileTwo = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter2.ts'
            };
            const changedFileThree = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter3.ts'
            };
            const changedFileFour = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter4.ts'
            };
            const changedFileFive = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter5.ts'
            };
            const changedFileSix = {
                event: 'change',
                ext: '.ts',
                filePath: '/some/fake/path/that/doesnt/matter6.ts'
            };
            const originalChangedFiles = [changedFileOne, changedFileTwo];
            const secondSetOfChangedFiles = [changedFileThree, changedFileFour];
            const thirdSetOfChangedFiles = [changedFileTwo, changedFileFour, changedFileFive, changedFileSix];
            const fourthSetOfChangedFiles = [changedFileOne, changedFileThree];
            const fifthSetOfChangedFiles = [changedFileFour, changedFileFive, changedFileSix];
            const context = {};
            let firstPromiseResolve = null;
            let secondPromiseResolve = null;
            let thirdPromiseResolve = null;
            const firstPromise = new Promise((resolve, reject) => {
                firstPromiseResolve = resolve;
            });
            const secondPromise = new Promise((resolve, reject) => {
                secondPromiseResolve = resolve;
            });
            const thirdPromise = new Promise((resolve, reject) => {
                thirdPromiseResolve = resolve;
            });
            spyOn(watch, watch.queueOrRunBuildUpdate.name).and.callThrough();
            const buildUpdateSpy = spyOn(build, build.buildUpdate.name).and.callFake((changedFiles, context) => {
                if (changedFiles === originalChangedFiles) {
                    return firstPromise;
                }
                else if (changedFiles.length === 5) {
                    // hardcode the length for now as it's easier to detect which array it'll be
                    return secondPromise;
                }
                else {
                    return thirdPromise;
                }
            });
            // call the original
            expect(watch.buildUpdatePromise).toBeFalsy();
            const promise = watch.queueOrRunBuildUpdate(originalChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(0);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            expect(buildUpdateSpy.calls.first().args[0]).toEqual(originalChangedFiles);
            expect(buildUpdateSpy.calls.first().args[1]).toEqual(context);
            // okay, call again and it should be queued now
            watch.queueOrRunBuildUpdate(secondSetOfChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(2);
            expect(watch.queuedChangedFileMap.get(changedFileThree.filePath)).toEqual(changedFileThree);
            expect(watch.queuedChangedFileMap.get(changedFileFour.filePath)).toEqual(changedFileFour);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            // okay, let's queue some more
            watch.queueOrRunBuildUpdate(thirdSetOfChangedFiles, context);
            expect(watch.buildUpdatePromise).toBeTruthy();
            expect(watch.queuedChangedFileMap.size).toEqual(5);
            expect(watch.queuedChangedFileMap.get(changedFileTwo.filePath)).toEqual(changedFileTwo);
            expect(watch.queuedChangedFileMap.get(changedFileThree.filePath)).toEqual(changedFileThree);
            expect(watch.queuedChangedFileMap.get(changedFileFour.filePath)).toEqual(changedFileFour);
            expect(watch.queuedChangedFileMap.get(changedFileFive.filePath)).toEqual(changedFileFive);
            expect(watch.queuedChangedFileMap.get(changedFileSix.filePath)).toEqual(changedFileSix);
            expect(build.buildUpdate).toHaveBeenCalledTimes(1);
            firstPromiseResolve();
            return firstPromise.then(() => {
                expect(build.buildUpdate).toHaveBeenCalledTimes(2);
                expect(buildUpdateSpy.calls.mostRecent().args[0].length).toEqual(5);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileTwo)[0]).toEqual(changedFileTwo);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileThree)[0]).toEqual(changedFileThree);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileFour)[0]).toEqual(changedFileFour);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileFive)[0]).toEqual(changedFileFive);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileSix)[0]).toEqual(changedFileSix);
                expect(buildUpdateSpy.calls.mostRecent().args[1]).toEqual(context);
                // okay, give it more changes so it queues that stuff up
                // also do some assertions homie
                watch.queueOrRunBuildUpdate(fourthSetOfChangedFiles, context);
                expect(watch.buildUpdatePromise).toBeTruthy();
                expect(watch.queuedChangedFileMap.size).toEqual(2);
                expect(watch.queuedChangedFileMap.get(changedFileOne.filePath)).toEqual(changedFileOne);
                expect(watch.queuedChangedFileMap.get(changedFileThree.filePath)).toEqual(changedFileThree);
                // cool beans yo, go ahead and resolve another promise
                secondPromiseResolve();
                return secondPromise;
            }).then(() => {
                expect(build.buildUpdate).toHaveBeenCalledTimes(3);
                expect(buildUpdateSpy.calls.mostRecent().args[0].length).toEqual(2);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileOne)[0]).toEqual(changedFileOne);
                expect(buildUpdateSpy.calls.mostRecent().args[0].concat().filter((changedFile) => changedFile === changedFileThree)[0]).toEqual(changedFileThree);
                // okay, give it more changes so it queues that stuff up
                // also do some assertions homie
                watch.queueOrRunBuildUpdate(fifthSetOfChangedFiles, context);
                expect(watch.buildUpdatePromise).toBeTruthy();
                expect(watch.queuedChangedFileMap.size).toEqual(3);
                expect(watch.queuedChangedFileMap.get(changedFileFour.filePath)).toEqual(changedFileFour);
                expect(watch.queuedChangedFileMap.get(changedFileFive.filePath)).toEqual(changedFileFive);
                expect(watch.queuedChangedFileMap.get(changedFileSix.filePath)).toEqual(changedFileSix);
                // cool beans yo, go ahead and resolve another promise
                thirdPromiseResolve();
                return thirdPromise;
            }).then(() => {
                // return the original promise just to make sure everything is chained together
                return promise;
            });
        });
    });
});
