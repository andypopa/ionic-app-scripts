"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOptions = exports.processTabsRequest = exports.processProviderRequest = exports.processComponentRequest = exports.processDirectiveRequest = exports.processPipeRequest = exports.processPageRequest = exports.getNgModules = void 0;
const Constants = require("./util/constants");
const util_1 = require("./generators/util");
Object.defineProperty(exports, "getNgModules", { enumerable: true, get: function () { return util_1.getNgModules; } });
function processPageRequest(context, name, commandOptions) {
    if (commandOptions) {
        const hydratedRequest = util_1.hydrateRequest(context, { type: 'page', name, includeNgModule: commandOptions.module });
        return util_1.generateTemplates(context, hydratedRequest, commandOptions.constants);
    }
    else {
        const hydratedRequest = util_1.hydrateRequest(context, { type: 'page', name, includeNgModule: false });
        return util_1.generateTemplates(context, hydratedRequest);
    }
}
exports.processPageRequest = processPageRequest;
function processPipeRequest(context, name, ngModulePath) {
    return util_1.nonPageFileManipulation(context, name, ngModulePath, 'pipe');
}
exports.processPipeRequest = processPipeRequest;
function processDirectiveRequest(context, name, ngModulePath) {
    return util_1.nonPageFileManipulation(context, name, ngModulePath, 'directive');
}
exports.processDirectiveRequest = processDirectiveRequest;
function processComponentRequest(context, name, ngModulePath) {
    return util_1.nonPageFileManipulation(context, name, ngModulePath, 'component');
}
exports.processComponentRequest = processComponentRequest;
function processProviderRequest(context, name, ngModulePath) {
    return util_1.nonPageFileManipulation(context, name, ngModulePath, 'provider');
}
exports.processProviderRequest = processProviderRequest;
function processTabsRequest(context, name, tabs, commandOptions) {
    const includePageConstants = commandOptions ? commandOptions.constants : false;
    const includeNgModule = commandOptions ? commandOptions.module : false;
    const tabHydratedRequests = tabs.map((tab) => util_1.hydrateRequest(context, { type: 'page', name: tab, includeNgModule }));
    const hydratedRequest = util_1.hydrateTabRequest(context, { type: 'tabs', name, includeNgModule, tabs: tabHydratedRequests });
    return util_1.generateTemplates(context, hydratedRequest, includePageConstants).then(() => {
        const promises = tabHydratedRequests.map((hydratedRequest) => {
            return util_1.generateTemplates(context, hydratedRequest, includePageConstants);
        });
        return Promise.all(promises);
    }).then((tabs) => {
        util_1.tabsModuleManipulation(tabs, hydratedRequest, tabHydratedRequests);
    });
}
exports.processTabsRequest = processTabsRequest;
function listOptions() {
    const list = [];
    list.push({ type: Constants.COMPONENT, multiple: false });
    list.push({ type: Constants.DIRECTIVE, multiple: false });
    list.push({ type: Constants.PAGE, multiple: false });
    list.push({ type: Constants.PIPE, multiple: false });
    list.push({ type: Constants.PROVIDER, multiple: false });
    list.push({ type: Constants.TABS, multiple: true });
    return list;
}
exports.listOptions = listOptions;
