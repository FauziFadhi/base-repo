"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
function invalidateCache(model, options, keys) {
    console.log('model', model);
    console.log('options', options);
    console.log('keys', keys);
    const previousModel = Object.assign(Object.assign({}, model['dataValues']), model['_previousDataValues']);
    if (options === null || options === void 0 ? void 0 : options.transaction) {
        return model;
    }
    console.log('hooks after update');
}
function annotate(target, options) {
    sequelize_typescript_1.addOptions(target.prototype, options);
}
function Cache(target) {
    const options = Object.assign({}, {
        hooks: {
            afterUpdate: (instance, options) => {
                return invalidateCache(instance, options, target.keys);
            },
            afterDestroy: (instance, options) => {
                return invalidateCache(instance, options, target.keys);
            },
            beforeBulkUpdate: function (options) {
                options.individualHooks = true;
            }
        },
    });
    console.log('cache2');
    console.log(target);
    annotate(target, options);
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map