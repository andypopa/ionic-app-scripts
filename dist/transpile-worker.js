"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transpile_1 = require("./transpile");
const context = {};
process.on('message', (incomingMsg) => {
    context.rootDir = incomingMsg.rootDir;
    context.buildDir = incomingMsg.buildDir;
    const workerConfig = {
        configFile: incomingMsg.configFile,
        writeInMemory: false,
        sourceMaps: false,
        cache: false,
        inlineTemplate: false,
        useTransforms: false
    };
    transpile_1.transpileWorker(context, workerConfig)
        .then(() => {
        const outgoingMsg = {
            transpileSuccess: true
        };
        process.send(outgoingMsg);
    })
        .catch(() => {
        const outgoingMsg = {
            transpileSuccess: false
        };
        process.send(outgoingMsg);
    });
});
