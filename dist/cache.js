"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const helpers_1 = require("./helpers");
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
async function invalidateCache(model, options, modelClass) {
    const previousModel = Object.assign(Object.assign({}, model['dataValues']), helpers_1.circularToJSON(model['_previousDataValues']));
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
    sequelize_typescript_1.addOptions(target.prototype, options);
}
async function invalidationCache(previousModel, modelClass) {
    const keys = await repository_module_1.RepositoryModule.catchKeyGetter({ keyPattern: `*:${modelClass.name}*:${previousModel[modelClass['primaryKeyAttribute']]}` });
    const invalidation = repository_module_1.RepositoryModule.cacheInvalidate;
    await Promise.all(keys.map(async (key) => await invalidation({ key })));
}
function Cache(cacheOptions) {
    return (target) => {
        const options = Object.assign({}, {
            hooks: {
                afterUpdate: async (instance, options) => {
                    console.log('instance', instance);
                    return await invalidateCache(instance, options, target);
                },
                afterDestroy: async (instance, options) => {
                    return await invalidateCache(instance, options, target);
                },
                beforeBulkUpdate: function (options) {
                    options.individualHooks = true;
                }
            },
        });
        target[`modelTTL`] = cacheOptions.ttl || 0;
        annotate(target, options);
    };
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map