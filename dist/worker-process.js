"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("./util/errors");
const helpers_1 = require("./util/helpers");
const logger_1 = require("./logger/logger");
process.on('message', (msg) => {
    try {
        const modulePath = `./${msg.taskModule}`;
        const taskWorker = require(modulePath)[msg.taskWorker];
        taskWorker(msg.context, msg.workerConfig)
            .then((val) => {
            taskResolve(msg.taskModule, msg.taskWorker, val);
        }, (val) => {
            taskReject(msg.taskModule, msg.taskWorker, val);
        })
            .catch((err) => {
            taskError(msg.taskModule, msg.taskWorker, err);
        });
    }
    catch (e) {
        taskError(msg.taskModule, msg.taskWorker, e);
        process.exit(1);
    }
});
function taskResolve(taskModule, taskWorker, val) {
    const msg = {
        taskModule: taskModule,
        taskWorker: taskWorker,
        resolve: val,
        pid: process.pid
    };
    logger_1.Logger.debug(`worker resolve, taskModule: ${msg.taskModule}, pid: ${msg.pid}`);
    process.send(msg);
}
function taskReject(taskModule, taskWorker, error) {
    const buildError = new errors_1.BuildError(error.message);
    const json = helpers_1.buildErrorToJson(buildError);
    const msg = {
        taskModule: taskModule,
        taskWorker: taskWorker,
        reject: json,
        pid: process.pid
    };
    logger_1.Logger.debug(`worker reject, taskModule: ${msg.taskModule}, pid: ${msg.pid}`);
    process.send(msg);
}
function taskError(taskModule, taskWorker, error) {
    const buildError = new errors_1.BuildError(error.message);
    const json = helpers_1.buildErrorToJson(buildError);
    const msg = {
        taskModule: taskModule,
        taskWorker: taskWorker,
        error: json,
        pid: process.pid
    };
    logger_1.Logger.debug(`worker error, taskModule: ${msg.taskModule}, pid: ${msg.pid}`);
    process.send(msg);
}
