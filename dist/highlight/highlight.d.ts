/**
 * Ported from highlight.js
 * Syntax highlighting with language autodetection.
 * https://highlightjs.org/
 * Copyright (c) 2006, Ivan Sagalaev
 * https://github.com/isagalaev/highlight.js/blob/master/LICENSE
 */
export declare function highlightError(htmlInput: string, errorCharStart: number, errorLength: number): string;
export declare function highlight(name: string, value: string, ignore_illegals?: boolean, continuation?: any): {
    value: string;
    relevance: number;
    language?: string;
    top?: any;
};
