"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_IGNORE_ARRAY = exports.getBasePath = exports.globAll = exports.generateGlobTasks = void 0;
const path_1 = require("path");
const globFunction = require("glob");
const helpers_1 = require("./helpers");
function isNegative(pattern) {
    return pattern[0] === '!';
}
function isString(pattern) {
    return typeof pattern === 'string';
}
function assertPatternsInput(patterns) {
    if (!patterns.every(isString)) {
        throw new Error('Each glob entry must be a string');
    }
}
function generateGlobTasks(patterns, opts) {
    patterns = [].concat(patterns);
    assertPatternsInput(patterns);
    const globTasks = [];
    opts = Object.assign({
        cache: Object.create(null),
        statCache: Object.create(null),
        realpathCache: Object.create(null),
        symlinks: Object.create(null),
        ignore: []
    }, opts);
    patterns.forEach(function (pattern, i) {
        if (isNegative(pattern)) {
            return;
        }
        const ignore = patterns.slice(i).filter(isNegative).map(function (pattern) {
            return pattern.slice(1);
        });
        const task = {
            pattern: pattern,
            opts: Object.assign({}, opts, {
                ignore: opts.ignore.concat(ignore).concat(exports.DEFAULT_IGNORE_ARRAY),
                nodir: true
            }),
            base: getBasePath(pattern)
        };
        globTasks.push(task);
    });
    return globTasks;
}
exports.generateGlobTasks = generateGlobTasks;
function globWrapper(task) {
    return new Promise((resolve, reject) => {
        globFunction(task.pattern, task.opts, (err, files) => {
            if (err) {
                return reject(err);
            }
            const globResults = files.map(file => {
                return {
                    absolutePath: path_1.normalize(path_1.resolve(file)),
                    base: path_1.normalize(path_1.resolve(getBasePath(task.pattern)))
                };
            });
            return resolve(globResults);
        });
    });
}
function globAll(globs) {
    return Promise.resolve().then(() => {
        const globTasks = generateGlobTasks(globs, {});
        let resultSet = [];
        const promises = [];
        for (const globTask of globTasks) {
            const promise = globWrapper(globTask);
            promises.push(promise);
            promise.then(globResult => {
                resultSet = resultSet.concat(globResult);
            });
        }
        return Promise.all(promises).then(() => {
            return resultSet;
        });
    });
}
exports.globAll = globAll;
function getBasePath(pattern) {
    var basePath;
    const sepRe = (process.platform === 'win32' ? /[\/\\]/ : /\/+/);
    var parent = globParent(pattern);
    basePath = toAbsoluteGlob(parent);
    if (!sepRe.test(basePath.charAt(basePath.length - 1))) {
        basePath += path_1.sep;
    }
    return basePath;
}
exports.getBasePath = getBasePath;
function isNegatedGlob(pattern) {
    var glob = { negated: false, pattern: pattern, original: pattern };
    if (pattern.charAt(0) === '!' && pattern.charAt(1) !== '(') {
        glob.negated = true;
        glob.pattern = pattern.slice(1);
    }
    return glob;
}
// https://github.com/jonschlinkert/to-absolute-glob/blob/master/index.js
function toAbsoluteGlob(pattern) {
    const cwd = helpers_1.toUnixPath(process.cwd());
    // trim starting ./ from glob patterns
    if (pattern.slice(0, 2) === './') {
        pattern = pattern.slice(2);
    }
    // when the glob pattern is only a . use an empty string
    if (pattern.length === 1 && pattern === '.') {
        pattern = '';
    }
    // store last character before glob is modified
    const suffix = pattern.slice(-1);
    // check to see if glob is negated (and not a leading negated-extglob)
    const ing = isNegatedGlob(pattern);
    pattern = ing.pattern;
    if (!path_1.isAbsolute(pattern) || pattern.slice(0, 1) === '\\') {
        pattern = path_1.join(cwd, pattern);
    }
    // if glob had a trailing `/`, re-add it now in case it was removed
    if (suffix === '/' && pattern.slice(-1) !== '/') {
        pattern += '/';
    }
    // re-add leading `!` if it was removed
    return ing.negated ? '!' + pattern : pattern;
}
// https://github.com/es128/glob-parent/blob/master/index.js
function globParent(pattern) {
    // special case for strings ending in enclosure containing path separator
    if (/[\{\[].*[\/]*.*[\}\]]$/.test(pattern))
        pattern += '/';
    // preserves full path in case of trailing path separator
    pattern += 'a';
    // remove path parts that are globby
    do {
        pattern = helpers_1.toUnixPath(path_1.dirname(pattern));
    } while (isGlob(pattern) || /(^|[^\\])([\{\[]|\([^\)]+$)/.test(pattern));
    // remove escape chars and return result
    return pattern.replace(/\\([\*\?\|\[\]\(\)\{\}])/g, '$1');
}
// https://github.com/jonschlinkert/is-glob/blob/master/index.js
function isGlob(pattern) {
    if (pattern === '') {
        return false;
    }
    if (isExtglob(pattern))
        return true;
    var regex = /(\\).|([*?]|\[.*\]|\{.*\}|\(.*\|.*\)|^!)/;
    var match;
    while ((match = regex.exec(pattern))) {
        if (match[2])
            return true;
        pattern = pattern.slice(match.index + match[0].length);
    }
    return false;
}
// https://github.com/jonschlinkert/is-extglob/blob/master/index.js
function isExtglob(pattern) {
    if (pattern === '') {
        return false;
    }
    var match;
    while ((match = /(\\).|([@?!+*]\(.*\))/g.exec(pattern))) {
        if (match[2])
            return true;
        pattern = pattern.slice(match.index + match[0].length);
    }
    return false;
}
exports.DEFAULT_IGNORE_ARRAY = ['**/*.DS_Store'];
