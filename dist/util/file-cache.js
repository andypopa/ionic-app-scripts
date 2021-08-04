"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCache = void 0;
class FileCache {
    constructor() {
        this.map = new Map();
    }
    set(key, file) {
        file.timestamp = Date.now();
        this.map.set(key, file);
    }
    get(key) {
        return this.map.get(key);
    }
    has(key) {
        return this.map.has(key);
    }
    remove(key) {
        const result = this.map.delete(key);
        return result;
    }
    getAll() {
        var list = [];
        this.map.forEach((file) => {
            list.push(file);
        });
        return list;
    }
    getRawStore() {
        return this.map;
    }
}
exports.FileCache = FileCache;
