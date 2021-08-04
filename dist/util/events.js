"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = exports.emit = exports.on = void 0;
const events_1 = require("events");
const logger_1 = require("../logger/logger");
const emmitter = new events_1.EventEmitter();
function on(eventType, listener) {
    logger_1.Logger.debug(`An ${eventType} event occurred`);
    return emmitter.on(eventType, listener);
}
exports.on = on;
function emit(eventType, val) {
    logger_1.Logger.debug(`Emitting event ${eventType}`);
    return emmitter.emit(eventType, val);
}
exports.emit = emit;
exports.EventType = {
    BuildUpdateCompleted: 'BuildUpdateCompleted',
    BuildUpdateStarted: 'BuildUpdateStarted',
    FileAdd: 'FileAdd',
    FileChange: 'FileChange',
    FileDelete: 'FileDelete',
    DirectoryAdd: 'DirectoryAdd',
    DirectoryDelete: 'DirectoryDelete',
    ReloadApp: 'ReloadApp',
    WebpackFilesChanged: 'WebpackFilesChanged'
};
