"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslint_1 = require("tslint");
const typescript_1 = require("typescript");
const ts = require("typescript");
const util_1 = require("util");
const lint_factory_1 = require("./lint-factory");
describe('lint factory', () => {
    describe('createProgram()', () => {
        it('should create a TS Program', () => {
            const context = { rootDir: '' };
            const program = lint_factory_1.createProgram(context, '');
            const fns = [
                'getSourceFiles',
                'getTypeChecker'
            ];
            expect(util_1.isObject(program)).toBeTruthy();
            for (const fn of fns) {
                expect(typeof program[fn]).toEqual('function');
            }
        });
    });
    describe('getTsLintConfig()', () => {
        it('should fetch the TSLint configuration from file path', () => {
            const tsConfigFilePath = 'tsconfig.json';
            const mockConfig = { rulesDirectory: ['node_modules/@ionic'] };
            spyOn(tslint_1.Configuration, tslint_1.Configuration.loadConfigurationFromPath.name).and.returnValue(mockConfig);
            const config = lint_factory_1.getTsLintConfig(tsConfigFilePath);
            expect(util_1.isObject(config)).toBeTruthy();
            expect(tslint_1.Configuration.loadConfigurationFromPath).toHaveBeenLastCalledWith(tsConfigFilePath);
            expect(config).toEqual(mockConfig);
        });
        it('should extend configuration with {linterOptions} if provided', () => {
            const tsConfigFilePath = 'tsconfig.json';
            const mockConfig = { rulesDirectory: ['node_modules/@ionic'] };
            spyOn(tslint_1.Configuration, tslint_1.Configuration.loadConfigurationFromPath.name).and.returnValue(mockConfig);
            const config = lint_factory_1.getTsLintConfig(tsConfigFilePath, {
                typeCheck: true
            });
            expect(config.linterOptions).toEqual({
                typeCheck: true
            });
        });
    });
    describe('createLinter()', () => {
        it('should create a Linter', () => {
            const context = { rootDir: '' };
            const program = lint_factory_1.createProgram(context, '');
            const linter = lint_factory_1.createLinter(context, program);
            expect(linter instanceof tslint_1.Linter).toBeTruthy();
        });
    });
    describe('getFileNames()', () => {
        it('should get the file names referenced in the tsconfig.json', () => {
            const context = { rootDir: '' };
            const program = lint_factory_1.createProgram(context, '');
            const mockFiles = ['test.ts'];
            spyOn(tslint_1.Linter, 'getFileNames').and.returnValue(mockFiles);
            const files = lint_factory_1.getFileNames(context, program);
            expect(Array.isArray(files)).toBeTruthy();
            expect(files).toEqual(mockFiles);
        });
    });
    describe('typeCheck()', () => {
        it('should not be called if {typeCheck} is false', done => {
            const context = { rootDir: '' };
            const program = lint_factory_1.createProgram(context, '');
            spyOn(ts, ts.getPreEmitDiagnostics.name).and.returnValue([]);
            lint_factory_1.typeCheck(context, program, { typeCheck: false })
                .then((result) => {
                expect(ts.getPreEmitDiagnostics).toHaveBeenCalledTimes(0);
                expect(result).toEqual([]);
                done();
            });
        });
        it('should type check if {typeCheck} is true', done => {
            const context = { rootDir: '' };
            const program = lint_factory_1.createProgram(context, '');
            const diagnostics = [{
                    file: {},
                    start: 2,
                    length: 10,
                    messageText: 'Oops',
                    category: typescript_1.DiagnosticCategory.Warning,
                    code: 120
                }];
            spyOn(ts, ts.getPreEmitDiagnostics.name).and.returnValue(diagnostics);
            lint_factory_1.typeCheck(context, program, { typeCheck: true })
                .then((result) => {
                expect(ts.getPreEmitDiagnostics).toHaveBeenCalledWith(program);
                expect(result).toEqual(diagnostics);
                done();
            });
        });
    });
    describe('lint()', () => {
        it('should lint a file', () => {
            const context = { rootDir: '' };
            const program = lint_factory_1.createProgram(context, '');
            const linter = lint_factory_1.createLinter(context, program);
            spyOn(linter, 'lint').and.returnValue(undefined);
            const config = {};
            const filePath = 'test.ts';
            const fileContents = 'const test = true;';
            lint_factory_1.lint(linter, config, filePath, fileContents);
            expect(linter.lint).toHaveBeenCalledWith(filePath, fileContents, config);
        });
    });
    describe('getLintResult()', () => {
        it('should get the lint results after linting a file', () => {
            const context = { rootDir: '' };
            const program = lint_factory_1.createProgram(context, '');
            const linter = lint_factory_1.createLinter(context, program);
            spyOn(linter, 'lint').and.returnValue(undefined);
            const mockResult = {};
            spyOn(linter, 'getResult').and.returnValue(mockResult);
            const config = {
                jsRules: new Map(),
                rules: new Map()
            };
            const filePath = 'test.ts';
            const fileContents = 'const test = true;';
            lint_factory_1.lint(linter, config, filePath, fileContents);
            const result = lint_factory_1.getLintResult(linter);
            expect(util_1.isObject(result)).toBeTruthy();
            expect(result).toEqual(mockResult);
        });
    });
});
