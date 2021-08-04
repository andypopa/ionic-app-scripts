"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildState = void 0;
var BuildState;
(function (BuildState) {
    BuildState[BuildState["SuccessfulBuild"] = 0] = "SuccessfulBuild";
    BuildState[BuildState["RequiresUpdate"] = 1] = "RequiresUpdate";
    BuildState[BuildState["RequiresBuild"] = 2] = "RequiresBuild";
})(BuildState = exports.BuildState || (exports.BuildState = {}));
