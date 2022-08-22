"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const helpers_1 = require("./helpers");
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
async function invalidateCache(model, options, modelClass) {
    const previousModel = Object.assign(Object.assign({}, model['dataValues']), (0, helpers_1.circularToJSON)(model['_previousDataValues']));
    console.log('previousModel', previousModel);
    if (options === null || options === void 0 ? void 0 : options.transaction) {
        options.transaction.afterCommit(() => {
            invalidationCache(previousModel, modelClass);
        });
        console.log('hooks after update transaction');
        return model;
    }
    invalidationCache(previousModel, modelClass);
    console.log('hooks after update');
    return model;
}
function annotate(target, options) {
    (0, sequelize_typescript_1.addOptions)(target.prototype, options);
}
async function invalidationCache(previousModel, modelClass) {
    const keys = await repository_module_1.RepositoryModule.catchKeyGetter({ keyPattern: `*:${modelClass.name}*:${previousModel[modelClass['primaryKeyAttribute']]}` });
    const invalidation = repository_module_1.RepositoryModule.cacheInvalidate;
    await Promise.all(keys.map(async (key) => {
        const usedKey = key === null || key === void 0 ? void 0 : key.substring(key === null || key === void 0 ? void 0 : key.indexOf(":"));
        if (usedKey)
            return await invalidation({ key: usedKey });
    }));
}
function Cache(cacheOptions) {
    return (target) => {
        const options = Object.assign({}, {
            hooks: {
                afterUpdate: async (instance, options) => {
                    invalidateCache(instance, options, target);
                    return instance;
                },
                afterDestroy: async (instance, options) => {
                    invalidateCache(instance, options, target);
                    return instance;
                },
                beforeBulkUpdate: async (options) => {
                    var _a;
                    const _b = options || { transaction: undefined }, { transaction } = _b, customOptions = __rest(_b, ["transaction"]);
                    (_a = target === null || target === void 0 ? void 0 : target['findAll']) === null || _a === void 0 ? void 0 : _a.call(target, customOptions).then(async (models) => {
                        await Promise.all((models || []).map(async (model) => {
                            if (model) {
                                invalidateCache(model, options, target);
                            }
                        }));
                    });
                }
            },
        });
        target[`modelTTL`] = (cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.ttl) || 0;
        annotate(target, options);
    };
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map