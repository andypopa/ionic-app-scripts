"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualFileStats = exports.VirtualDirStats = exports.VirtualStats = void 0;
const dev = Math.floor(Math.random() * 10000);
class VirtualStats {
    constructor(_path) {
        this._path = _path;
        this._ctime = new Date();
        this._mtime = new Date();
        this._atime = new Date();
        this._btime = new Date();
        this._dev = dev;
        this._ino = Math.floor(Math.random() * 100000);
        this._mode = parseInt('777', 8); // RWX for everyone.
        this._uid = process.env['UID'] ? parseInt(process.env['UID'], 0) : 0;
        this._gid = process.env['GID'] ? parseInt(process.env['GID'], 0) : 0;
    }
    isFile() { return false; }
    isDirectory() { return false; }
    isBlockDevice() { return false; }
    isCharacterDevice() { return false; }
    isSymbolicLink() { return false; }
    isFIFO() { return false; }
    isSocket() { return false; }
    get dev() { return this._dev; }
    get ino() { return this._ino; }
    get mode() { return this._mode; }
    get nlink() { return 1; } // Default to 1 hard link.
    get uid() { return this._uid; }
    get gid() { return this._gid; }
    get rdev() { return 0; }
    get size() { return 0; }
    get blksize() { return 512; }
    get blocks() { return Math.ceil(this.size / this.blksize); }
    get atime() { return this._atime; }
    get mtime() { return this._mtime; }
    get ctime() { return this._ctime; }
    get birthtime() { return this._btime; }
}
exports.VirtualStats = VirtualStats;
class VirtualDirStats extends VirtualStats {
    constructor(_fileName) {
        super(_fileName);
    }
    isDirectory() { return true; }
    get size() { return 1024; }
}
exports.VirtualDirStats = VirtualDirStats;
class VirtualFileStats extends VirtualStats {
    constructor(_fileName, _content) {
        super(_fileName);
        this._content = _content;
    }
    get content() { return this._content; }
    set content(v) {
        this._content = v;
        this._mtime = new Date();
    }
    isFile() { return true; }
    get size() { return this._content.length; }
}
exports.VirtualFileStats = VirtualFileStats;
