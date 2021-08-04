"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Constants = require("./util/constants");
const workerClient = require("./worker-client");
const lint_1 = require("./lint");
let originalEnv = process.env;
describe('lint task', () => {
    describe('lint', () => {
        beforeEach(() => {
            originalEnv = process.env;
            process.env = {};
        });
        afterEach(() => {
            process.env = originalEnv;
        });
        it('should return a resolved promise', (done) => {
            spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.resolve());
            lint_1.lint(null).then(() => {
                done();
            });
        });
        it('should return resolved promise when bailOnLintError is not set', (done) => {
            spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.reject(new Error('Simulating an error')));
            lint_1.lint(null).then(() => {
                done();
            });
        });
        it('should return rejected promise when bailOnLintError is set', (done) => {
            spyOn(workerClient, workerClient.runWorker.name).and.returnValue(Promise.reject(new Error('Simulating an error')));
            process.env[Constants.ENV_BAIL_ON_LINT_ERROR] = 'true';
            lint_1.lint(null).catch(() => {
                done();
            });
        });
    });
});
