"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheUtility = void 0;
const crypto = require("crypto");
class CacheUtility {
    static setKey(name, key, options) {
        const opt = (options) ? `:${options}` : '';
        return `:${name}_${key}${opt}`;
    }
    static setQueryOptions(options) {
        const hash = crypto.createHash('md5');
        return ((Object.keys(options).length === 0) ? 'all' : hash.update(JSON.stringify(options)).digest('base64'));
    }
    static getKeyTime(key) {
        const str = key.split('_');
        return parseInt(str.slice(-1)[0], 10);
    }
    static setResult(result) {
        return JSON.parse(result);
    }
    static setOneQueryOptions(options) {
        const hash = crypto.createHash('md5');
        return ((Object.keys(options).length === 0) ? 'one' : hash.update(JSON.stringify(options)).digest('base64'));
    }
}
exports.CacheUtility = CacheUtility;
exports.default = CacheUtility;
//# sourceMappingURL=cache-utilty.js.map