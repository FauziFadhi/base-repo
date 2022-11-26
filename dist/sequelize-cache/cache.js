"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const helpers_1 = require("../helpers");
const sequelize_cache_1 = require("./sequelize-cache");
const sequelize_typescript_1 = require("sequelize-typescript");
async function invalidateCache(model, options, modelClass) {
    if (sequelize_cache_1.SequelizeCache.showLog) {
        const previousModel = { ...model['dataValues'], ...(0, helpers_1.circularToJSON)(model['_previousDataValues']) };
        sequelize_cache_1.SequelizeCache.logging(previousModel);
    }
    if (options?.transaction) {
        options.transaction.afterCommit(() => {
            invalidationCache({
                [modelClass['primaryKeyAttribute']]: model['_previousDataValues']?.[modelClass['primaryKeyAttribute']],
            }, modelClass);
        });
        sequelize_cache_1.SequelizeCache.logging('hooks after update transaction');
        return model;
    }
    invalidationCache({
        [modelClass['primaryKeyAttribute']]: model['_previousDataValues']?.[modelClass['primaryKeyAttribute']],
    }, modelClass);
    sequelize_cache_1.SequelizeCache.logging('hooks after update');
    return model;
}
function annotate(target, options) {
    (0, sequelize_typescript_1.addOptions)(target.prototype, options);
}
async function invalidationCache(previousModel, modelClass) {
    const keys = await sequelize_cache_1.SequelizeCache.catchKeyGetter({ keyPattern: `*:${modelClass.name}_*:${previousModel[modelClass['primaryKeyAttribute']]}` });
    const invalidation = sequelize_cache_1.SequelizeCache.cacheInvalidate;
    await Promise.all(keys?.map(async (key) => {
        const usedKey = key?.substring(key?.indexOf(":"));
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
                    if (options.where?.id?.length || (options?.where?.id && typeof options?.where?.id !== 'object')) {
                        return;
                    }
                    const { transaction, ...customOptions } = options || { transaction: undefined };
                    target?.['findAll']?.(customOptions).then(async (models) => {
                        await Promise.all((models || []).map(async (model) => {
                            if (model) {
                                invalidateCache(model, options, target);
                            }
                        }));
                    });
                },
                AfterBulkUpdate: async (options) => {
                    const id = options.where?.id;
                    if (!id) {
                        return;
                    }
                    if (Array.isArray(id)) {
                        const ids = [...new Set(id)];
                        Promise.all(ids?.map((i) => {
                            invalidationCache({
                                [target['primaryKeyAttribute']]: i,
                            }, target);
                        }));
                        return;
                    }
                    if (typeof id !== 'object') {
                        invalidationCache({
                            [target['primaryKeyAttribute']]: id,
                        }, target);
                    }
                    return;
                }
            },
        });
        target[`modelTTL`] = cacheOptions?.ttl || 0;
        annotate(target, options);
    };
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map