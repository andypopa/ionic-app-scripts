"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const errors_1 = require("../util/errors");
const config_1 = require("../util/config");
const chalk = require("chalk");
class Logger {
    constructor(scope) {
        this.start = Date.now();
        this.scope = scope;
        let msg = `${scope} started ${chalk.dim('...')}`;
        if (config_1.isDebugMode()) {
            msg += memoryUsage();
        }
        Logger.info(msg);
    }
    ready(color, bold) {
        this.completed('ready', color, bold);
    }
    finish(color, bold) {
        this.completed('finished', color, bold);
    }
    completed(type, color, bold) {
        const duration = Date.now() - this.start;
        let time;
        if (duration > 1000) {
            time = 'in ' + (duration / 1000).toFixed(2) + ' s';
        }
        else {
            let ms = parseFloat((duration).toFixed(3));
            if (ms > 0) {
                time = 'in ' + duration + ' ms';
            }
            else {
                time = 'in less than 1 ms';
            }
        }
        let msg = `${this.scope} ${type}`;
        if (color) {
            msg = chalk[color](msg);
        }
        if (bold) {
            msg = chalk.bold(msg);
        }
        msg += ' ' + chalk.dim(time);
        if (config_1.isDebugMode()) {
            msg += memoryUsage();
        }
        Logger.info(msg);
    }
    fail(err) {
        if (err) {
            if (err instanceof errors_1.IgnorableError) {
                return;
            }
            if (err instanceof errors_1.BuildError) {
                let failedMsg = `${this.scope} failed`;
                if (err.message) {
                    failedMsg += `: ${err.message}`;
                }
                if (!err.hasBeenLogged) {
                    Logger.error(`${failedMsg}`);
                    err.hasBeenLogged = true;
                    if (err.stack && config_1.isDebugMode()) {
                        Logger.debug(err.stack);
                    }
                }
                else if (config_1.isDebugMode()) {
                    Logger.debug(`${failedMsg}`);
                }
                return err;
            }
        }
        return err;
    }
    setStartTime(startTime) {
        this.start = startTime;
    }
    /**
     * Does not print out a time prefix or color any text. Only prefix
     * with whitespace so the message is lined up with timestamped logs.
     */
    static log(...msg) {
        Logger.wordWrap(msg).forEach(line => {
            console.log(line);
        });
    }
    /**
     * Prints out a dim colored timestamp prefix, with optional color
     * and bold message.
     */
    static info(msg, color, bold) {
        const lines = Logger.wordWrap([msg]);
        if (lines.length) {
            let prefix = timePrefix();
            let lineOneMsg = lines[0].substr(prefix.length);
            if (color) {
                lineOneMsg = chalk[color](lineOneMsg);
            }
            if (bold) {
                lineOneMsg = chalk.bold(lineOneMsg);
            }
            lines[0] = chalk.dim(prefix) + lineOneMsg;
        }
        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                if (color) {
                    line = chalk[color](line);
                }
                if (bold) {
                    line = chalk.bold(line);
                }
            }
            console.log(line);
        });
    }
    /**
     * Prints out a yellow colored timestamp prefix.
     */
    static warn(...msg) {
        const lines = Logger.wordWrap(msg);
        if (lines.length) {
            let prefix = timePrefix();
            lines[0] = prefix + lines[0].substr(prefix.length);
        }
        lines.forEach(line => {
            console.warn(chalk.yellow(line));
        });
    }
    /**
     * Prints out a error colored timestamp prefix.
     */
    static error(...msg) {
        const lines = Logger.wordWrap(msg);
        if (lines.length) {
            let prefix = timePrefix();
            lines[0] = prefix + lines[0].substr(prefix.length);
            if (config_1.isDebugMode()) {
                lines[0] += memoryUsage();
            }
        }
        lines.forEach(line => {
            console.error(chalk.red(line));
        });
    }
    static unformattedError(msg) {
        console.error(chalk.red(msg));
    }
    static unformattedDebug(msg) {
        console.log(chalk.cyan(msg));
    }
    /**
     * Prints out a blue colored DEBUG prefix. Only prints out when debug mode.
     */
    static debug(...msg) {
        if (config_1.isDebugMode()) {
            msg.push(memoryUsage());
            const lines = Logger.wordWrap(msg);
            if (lines.length) {
                let prefix = '[ DEBUG! ]';
                lines[0] = prefix + lines[0].substr(prefix.length);
            }
            lines.forEach(line => {
                console.log(chalk.cyan(line));
            });
        }
    }
    static wordWrap(msg) {
        const output = [];
        const words = [];
        msg.forEach(m => {
            if (m === null) {
                words.push('null');
            }
            else if (typeof m === 'undefined') {
                words.push('undefined');
            }
            else if (typeof m === 'string') {
                m.replace(/\s/gm, ' ').split(' ').forEach(strWord => {
                    if (strWord.trim().length) {
                        words.push(strWord.trim());
                    }
                });
            }
            else if (typeof m === 'number' || typeof m === 'boolean') {
                words.push(m.toString());
            }
            else if (typeof m === 'function') {
                words.push(m.toString());
            }
            else if (Array.isArray(m)) {
                words.push(() => {
                    return m.toString();
                });
            }
            else if (Object(m) === m) {
                words.push(() => {
                    return m.toString();
                });
            }
            else {
                words.push(m.toString());
            }
        });
        let line = Logger.INDENT;
        words.forEach(word => {
            if (typeof word === 'function') {
                if (line.trim().length) {
                    output.push(line);
                }
                output.push(word());
                line = Logger.INDENT;
            }
            else if (Logger.INDENT.length + word.length > Logger.MAX_LEN) {
                // word is too long to play nice, just give it its own line
                if (line.trim().length) {
                    output.push(line);
                }
                output.push(Logger.INDENT + word);
                line = Logger.INDENT;
            }
            else if ((word.length + line.length) > Logger.MAX_LEN) {
                // this word would make the line too long
                // print the line now, then start a new one
                output.push(line);
                line = Logger.INDENT + word + ' ';
            }
            else {
                line += word + ' ';
            }
        });
        if (line.trim().length) {
            output.push(line);
        }
        return output;
    }
    static formatFileName(rootDir, fileName) {
        fileName = fileName.replace(rootDir, '');
        if (/\/|\\/.test(fileName.charAt(0))) {
            fileName = fileName.substr(1);
        }
        if (fileName.length > 80) {
            fileName = '...' + fileName.substr(fileName.length - 80);
        }
        return fileName;
    }
    static formatHeader(type, fileName, rootDir, startLineNumber = null, endLineNumber = null) {
        let header = `${type}: ${Logger.formatFileName(rootDir, fileName)}`;
        if (startLineNumber !== null && startLineNumber > 0) {
            if (endLineNumber !== null && endLineNumber > startLineNumber) {
                header += `, lines: ${startLineNumber} - ${endLineNumber}`;
            }
            else {
                header += `, line: ${startLineNumber}`;
            }
        }
        return header;
    }
    static newLine() {
        console.log('');
    }
}
exports.Logger = Logger;
Logger.INDENT = '            ';
Logger.MAX_LEN = 120;
function timePrefix() {
    const date = new Date();
    return '[' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + ']';
}
function memoryUsage() {
    return chalk.dim(` MEM: ${(process.memoryUsage().rss / 1000000).toFixed(1)}MB`);
}
