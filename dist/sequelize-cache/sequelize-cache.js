"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeCache = void 0;
class SequelizeCache {
    static logging(value) {
        if (!SequelizeCache.showLog)
            return;
        if (SequelizeCache.log)
            SequelizeCache.log(value);
        console.log(value);
    }
}
exports.SequelizeCache = SequelizeCache;
//# sourceMappingURL=sequelize-cache.js.map