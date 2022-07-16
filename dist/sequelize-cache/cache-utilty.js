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
        CacheUtility.cleanOptions(options);
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
        CacheUtility.cleanOptions(options);
        return ((Object.keys(options).length === 0) ? 'one' : hash.update(JSON.stringify(options)).digest('base64'));
    }
    static cleanOptions(options) {
        CacheUtility.cleanIncludeOptions(options?.include);
    }
    static cleanIncludeOptions(include) {
        if (!include)
            return;
        if (Array.isArray(include)) {
            include.forEach((include) => {
                delete include.association;
                if (include?.include)
                    CacheUtility.cleanIncludeOptions(include?.include);
            });
        }
        else {
            delete include.association;
            if (include?.include)
                CacheUtility.cleanIncludeOptions(include?.include);
        }
    }
}
exports.CacheUtility = CacheUtility;
exports.default = CacheUtility;
//# sourceMappingURL=cache-utilty.js.map