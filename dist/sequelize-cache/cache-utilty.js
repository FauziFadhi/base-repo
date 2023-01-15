"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheUtility = void 0;
const xxhashjs_1 = require("xxhashjs");
class CacheUtility {
    static setKey(name, key, options) {
        const opt = (options) ? `:${options}` : '';
        return `:${name}_${key}${opt}`;
    }
    static setQueryOptions(options) {
        CacheUtility.cleanOptions(options);
        return ((Object.keys(options).length === 0) ? 'all' : (0, xxhashjs_1.h64)(JSON.stringify(options), 0xABCD).toString(16));
    }
    static getKeyTime(key) {
        const str = key.split('_');
        return parseInt(str.slice(-1)[0], 10);
    }
    static setResult(result) {
        return JSON.parse(result);
    }
    static setOneQueryOptions(options) {
        CacheUtility.cleanOptions(options);
        return ((Object.keys(options).length === 0) ? 'one' : (0, xxhashjs_1.h64)(JSON.stringify(options), 0xABCD).toString(16));
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