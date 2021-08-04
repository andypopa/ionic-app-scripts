export declare class VirtualStats {
    protected _path: string;
    protected _ctime: Date;
    protected _mtime: Date;
    protected _atime: Date;
    protected _btime: Date;
    protected _dev: number;
    protected _ino: number;
    protected _mode: number;
    protected _uid: number;
    protected _gid: number;
    constructor(_path: string);
    isFile(): boolean;
    isDirectory(): boolean;
    isBlockDevice(): boolean;
    isCharacterDevice(): boolean;
    isSymbolicLink(): boolean;
    isFIFO(): boolean;
    isSocket(): boolean;
    get dev(): number;
    get ino(): number;
    get mode(): number;
    get nlink(): number;
    get uid(): number;
    get gid(): number;
    get rdev(): number;
    get size(): number;
    get blksize(): number;
    get blocks(): number;
    get atime(): Date;
    get mtime(): Date;
    get ctime(): Date;
    get birthtime(): Date;
}
export declare class VirtualDirStats extends VirtualStats {
    constructor(_fileName: string);
    isDirectory(): boolean;
    get size(): number;
}
export declare class VirtualFileStats extends VirtualStats {
    private _content;
    constructor(_fileName: string, _content: string);
    get content(): string;
    set content(v: string);
    isFile(): boolean;
    get size(): number;
}
