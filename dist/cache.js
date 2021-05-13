"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const helpers_1 = require("./helpers");
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
const cache_utilty_1 = require("./cache-utilty");
async function invalidateCache(model, options, { name, caches }) {
    const previousModel = Object.assign(Object.assign({}, model['dataValues']), helpers_1.circularToJSON(model['_previousDataValues']));
    console.log('previousModel', previousModel);
    if (options === null || options === void 0 ? void 0 : options.transaction) {
        options.transaction.afterCommit(() => {
            invalidationCache(previousModel, { name, caches });
        });
        console.log('hooks after update transaction');
        return model;
    }
    invalidationCache(previousModel, { name, caches });
    console.log('hooks after update');
    return model;
}
function annotate(target, options) {
    sequelize_typescript_1.addOptions(target.prototype, options);
}
function getWhereOptions(previousModel, attributes) {
    if (!(attributes === null || attributes === void 0 ? void 0 : attributes.length))
        return undefined;
    return attributes === null || attributes === void 0 ? void 0 : attributes.reduce((result, current) => {
        return Object.assign(Object.assign({}, result), { [current]: previousModel[current] });
    }, {});
}
function getOptions(previousModel, cache) {
    const where = getWhereOptions(previousModel, cache.attributes);
    const having = getWhereOptions(previousModel, cache.havingAttributes);
    const group = cache.group;
    return { where, having, group };
}
async function invalidationCache(previousModel, { name: modelName, caches }) {
    findByPkInvalidation(previousModel, modelName);
    const cacheInvalidate = [];
    const invalidation = repository_module_1.RepositoryModule.cacheInvalidate;
    for (const keyName in caches) {
        const cache = caches[keyName];
        const cacheOptions = getOptions(previousModel, cache);
        const whereOptionsString = cache_utilty_1.default.setQueryOptions(cacheOptions);
        const key = cache_utilty_1.default.setKey(modelName, whereOptionsString, keyName);
        cacheInvalidate.push(await invalidation({ key }));
    }
}
async function findByPkInvalidation(previousModel, modelName) {
    const key = cache_utilty_1.default.setKey(`${modelName}`, previousModel.id, 'id');
    const invalidation = repository_module_1.RepositoryModule.cacheInvalidate;
    return await invalidation({ key });
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
        console.log('cache2');
        console.log('cacheOptions', cacheOptions);
        target['caches'] = cacheOptions.caches || {};
        target[`modelTTL`] = cacheOptions.ttl || 0;
        annotate(target, options);
    };
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map