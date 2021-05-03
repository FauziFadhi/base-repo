"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base = void 0;
const cache_utilty_1 = require("./cache-utilty");
const sequelize_typescript_1 = require("sequelize-typescript");
function base(cacheKeys) {
    return class BaseModel extends sequelize_typescript_1.Model {
        static async findOneCache(keys, whereOptions, cacheOptions = { ttl: 1000, rejectOnEmpty: false }) {
            return await this.findOne({ where: whereOptions });
        }
    };
}
exports.base = base;
//# sourceMappingURL=base-model.js.map