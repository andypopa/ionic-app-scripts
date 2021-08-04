"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectJson = void 0;
const path = require("path");
const fs = require("fs");
const promisify_1 = require("./promisify");
const readFilePromise = promisify_1.promisify(fs.readFile);
function getProjectJson() {
    const projectFile = path.join(process.cwd(), 'ionic.config.json');
    return readFilePromise(projectFile).then(function (textString) {
        return JSON.parse(textString.toString());
    });
}
exports.getProjectJson = getProjectJson;
