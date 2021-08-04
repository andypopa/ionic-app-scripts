"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgnorableError = exports.BuildError = void 0;
class BuildError extends Error {
    constructor(error) {
        super(error instanceof Error ? error.message : error);
        this.hasBeenLogged = false;
        this.isFatal = false;
        if (error instanceof Error) {
            this.message = error.message;
            this.stack = error.stack;
            this.name = error.name;
            this.hasBeenLogged = error.hasBeenLogged;
            this.isFatal = error.isFatal;
        }
    }
}
exports.BuildError = BuildError;
/* There are special cases where strange things happen where we don't want any logging, etc.
 * For our sake, it is much easier to get off the happy path of code and just throw an exception
 * and do nothing with it
 */
class IgnorableError extends Error {
    constructor(msg) {
        super(msg);
    }
}
exports.IgnorableError = IgnorableError;
