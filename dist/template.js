"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateMatch = exports.getTemplateFormat = exports.replaceExistingJsTemplate = exports.replaceTemplateUrl = exports.updateTemplate = exports.inlineTemplate = exports.templateUpdate = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const Constants = require("./util/constants");
const interfaces_1 = require("./util/interfaces");
const helpers_1 = require("./util/helpers");
const logger_1 = require("./logger/logger");
function templateUpdate(changedFiles, context) {
    try {
        const changedTemplates = changedFiles.filter(changedFile => changedFile.ext === '.html');
        const start = Date.now();
        const bundleFiles = context.fileCache.getAll().filter(file => file.path.indexOf(context.buildDir) >= 0 && path_1.extname(file.path) === '.js');
        // update the corresponding transpiled javascript file with the template changed (inline it)
        // as well as the bundle
        for (const changedTemplateFile of changedTemplates) {
            const file = context.fileCache.get(changedTemplateFile.filePath);
            if (!updateCorrespondingJsFile(context, file.content, changedTemplateFile.filePath)) {
                throw new Error(`Failed to inline template ${changedTemplateFile.filePath}`);
            }
            // find the corresponding bundles
            for (const bundleFile of bundleFiles) {
                const newContent = replaceExistingJsTemplate(bundleFile.content, file.content, changedTemplateFile.filePath);
                if (newContent && newContent !== bundleFile.content) {
                    context.fileCache.set(bundleFile.path, { path: bundleFile.path, content: newContent });
                    fs_1.writeFileSync(bundleFile.path, newContent);
                }
            }
        }
        // awesome, all good and template updated in the bundle file
        const logger = new logger_1.Logger(`template update`);
        logger.setStartTime(start);
        // congrats, all good
        changedTemplates.forEach(changedTemplate => {
            logger_1.Logger.debug(`templateUpdate, updated: ${changedTemplate.filePath}`);
        });
        context.templateState = interfaces_1.BuildState.SuccessfulBuild;
        logger.finish();
        return Promise.resolve();
    }
    catch (ex) {
        logger_1.Logger.debug(`templateUpdate error: ${ex.message}`);
        context.transpileState = interfaces_1.BuildState.RequiresBuild;
        context.deepLinkState = interfaces_1.BuildState.RequiresBuild;
        context.bundleState = interfaces_1.BuildState.RequiresUpdate;
        return Promise.resolve();
    }
}
exports.templateUpdate = templateUpdate;
function updateCorrespondingJsFile(context, newTemplateContent, existingHtmlTemplatePath) {
    const moduleFileExtension = helpers_1.changeExtension(helpers_1.getStringPropertyValue(Constants.ENV_NG_MODULE_FILE_NAME_SUFFIX), '.js');
    const javascriptFiles = context.fileCache.getAll().filter((file) => path_1.dirname(file.path) === path_1.dirname(existingHtmlTemplatePath) && path_1.extname(file.path) === '.js' && !file.path.endsWith(moduleFileExtension));
    for (const javascriptFile of javascriptFiles) {
        const newContent = replaceExistingJsTemplate(javascriptFile.content, newTemplateContent, existingHtmlTemplatePath);
        if (newContent && newContent !== javascriptFile.content) {
            javascriptFile.content = newContent;
            // set the file again to generate a new timestamp
            // do the same for the typescript file just to invalidate any caches, etc.
            context.fileCache.set(javascriptFile.path, javascriptFile);
            const typescriptFilePath = helpers_1.changeExtension(javascriptFile.path, '.ts');
            context.fileCache.set(typescriptFilePath, context.fileCache.get(typescriptFilePath));
            return true;
        }
    }
    return false;
}
function inlineTemplate(sourceText, sourcePath) {
    const componentDir = path_1.parse(sourcePath).dir;
    let match;
    let replacement;
    let lastMatch = null;
    while (match = getTemplateMatch(sourceText)) {
        if (match.component === lastMatch) {
            // panic! we don't want to melt any machines if there's a bug
            logger_1.Logger.debug(`Error matching component: ${match.component}`);
            return sourceText;
        }
        lastMatch = match.component;
        if (match.templateUrl === '') {
            logger_1.Logger.error(`Error @Component templateUrl missing in: "${sourcePath}"`);
            return sourceText;
        }
        replacement = updateTemplate(componentDir, match);
        if (replacement) {
            sourceText = sourceText.replace(match.component, replacement);
        }
    }
    return sourceText;
}
exports.inlineTemplate = inlineTemplate;
function updateTemplate(componentDir, match) {
    const htmlFilePath = path_1.join(componentDir, match.templateUrl);
    try {
        const templateContent = fs_1.readFileSync(htmlFilePath, 'utf8');
        return replaceTemplateUrl(match, htmlFilePath, templateContent);
    }
    catch (e) {
        logger_1.Logger.error(`template error, "${htmlFilePath}": ${e}`);
    }
    return null;
}
exports.updateTemplate = updateTemplate;
function replaceTemplateUrl(match, htmlFilePath, templateContent) {
    const orgTemplateProperty = match.templateProperty;
    const newTemplateProperty = getTemplateFormat(htmlFilePath, templateContent);
    return match.component.replace(orgTemplateProperty, newTemplateProperty);
}
exports.replaceTemplateUrl = replaceTemplateUrl;
function replaceExistingJsTemplate(existingSourceText, newTemplateContent, htmlFilePath) {
    let prefix = getTemplatePrefix(htmlFilePath);
    let startIndex = existingSourceText.indexOf(prefix);
    let isStringified = false;
    if (startIndex === -1) {
        prefix = stringify(prefix);
        isStringified = true;
    }
    startIndex = existingSourceText.indexOf(prefix);
    if (startIndex === -1) {
        return null;
    }
    let suffix = getTemplateSuffix(htmlFilePath);
    if (isStringified) {
        suffix = stringify(suffix);
    }
    const endIndex = existingSourceText.indexOf(suffix, startIndex + 1);
    if (endIndex === -1) {
        return null;
    }
    const oldTemplate = existingSourceText.substring(startIndex, endIndex + suffix.length);
    let newTemplate = getTemplateFormat(htmlFilePath, newTemplateContent);
    if (isStringified) {
        newTemplate = stringify(newTemplate);
    }
    let lastChange = null;
    while (existingSourceText.indexOf(oldTemplate) > -1 && existingSourceText !== lastChange) {
        lastChange = existingSourceText = existingSourceText.replace(oldTemplate, newTemplate);
    }
    return existingSourceText;
}
exports.replaceExistingJsTemplate = replaceExistingJsTemplate;
function stringify(str) {
    str = JSON.stringify(str);
    return str.substr(1, str.length - 2);
}
function getTemplateFormat(htmlFilePath, content) {
    // turn the template into one line and espcape single quotes
    content = content.replace(/\r|\n/g, '\\n');
    content = content.replace(/\'/g, '\\\'');
    return `${getTemplatePrefix(htmlFilePath)}\'${content}\'${getTemplateSuffix(htmlFilePath)}`;
}
exports.getTemplateFormat = getTemplateFormat;
function getTemplatePrefix(htmlFilePath) {
    return `template:/*ion-inline-start:"${path_1.resolve(htmlFilePath)}"*/`;
}
function getTemplateSuffix(htmlFilePath) {
    return `/*ion-inline-end:"${path_1.resolve(htmlFilePath)}"*/`;
}
function getTemplateMatch(str) {
    const match = COMPONENT_REGEX.exec(str);
    if (match) {
        return {
            start: match.index,
            end: match.index + match[0].length,
            component: match[0],
            templateProperty: match[3],
            templateUrl: match[5].trim()
        };
    }
    return null;
}
exports.getTemplateMatch = getTemplateMatch;
const COMPONENT_REGEX = /Component\s*?\(\s*?(\{([\s\S]*?)(\s*templateUrl\s*:\s*(['"`])(.*?)(['"`])\s*?)([\s\S]*?)}\s*?)\)/m;
