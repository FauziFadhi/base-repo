"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheUtility = void 0;
const crypto = require("crypto");
class CacheUtility {
    static setKey(name, key, options) {
        const opt = (options) ? ':' + options : '';
        return ':' + name + opt + '_' + key;
    }
    static setQueryOptions(options) {
        const hash = crypto.createHash('md5');
        return ((Object.keys(options).length === 0) ? 'all' : hash.update(JSON.stringify(options)).digest('base64'));
    }
    static getKeyTime(key) {
        const str = key.split('_');
        return parseInt(str.slice(-1)[0], 10);
    }
    static async invalidate(key, cacheStore) {
        return await cacheStore.del(key) === 1 ? true : false;
    }
    static setResult(result) {
        return JSON.parse(result);
    }
    static flush(cacheStore) {
        cacheStore.flushall();
    }
    static setOneQueryOptions(options) {
        const hash = crypto.createHash('md5');
        return ((Object.keys(options).length === 0) ? 'one' : hash.update(JSON.stringify(options)).digest('base64'));
    }
}
exports.CacheUtility = CacheUtility;
exports.default = CacheUtility;
//# sourceMappingURL=cache-utilty.js.map