"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base = void 0;
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
const cache_utilty_1 = require("./cache-utilty");
function setWhereOptions(whereOptions, attributes) {
    const newWhereOptions = attributes.reduce((result, current) => {
        const currentPropValue = whereOptions[current];
        if (currentPropValue == undefined)
            throw new Error(`${[current]} value is missing`);
        return Object.assign(Object.assign({}, result), { [current]: whereOptions[current] });
    }, {});
    return newWhereOptions;
}
function getAttributesKey(key, cacheKeys) {
    const cacheKey = cacheKeys.find(cache => cache.name === key);
    if (!cacheKey || !cacheKey.attributes)
        throw new Error(`cacheKey ${key} not exists`);
    return cacheKey.attributes;
}
function transformCacheToModel(modelClass, dataCache) {
    const modelData = JSON.parse(dataCache);
    if (!modelData)
        return null;
    console.log('modelClass', modelClass);
    const model = new modelClass(modelData, { isNewRecord: false });
    if (modelData.createdAt)
        model.setDataValue('createdAt', modelData.createdAt);
    if (modelData.updatedAt)
        model.setDataValue('updatedAt', modelData.updatedAt);
    return model;
}
function base(caches) {
    var _a;
    return _a = class BaseModel extends sequelize_typescript_1.Model {
            static async findOneCache(cacheName, options) {
                console.log('modelTTL', this.modelTTL);
                const ttl = options.ttl || this.modelTTL || repository_module_1.RepositoryModule.defaultTTL;
                if (!caches.some(cache => cache.name === cacheName))
                    throw new Error(`cache name '${cacheName}' not exists at model ${this.name}`);
                const attributesKey = getAttributesKey(cacheName, this.caches);
                const whereOptions = setWhereOptions(options === null || options === void 0 ? void 0 : options.where, attributesKey);
                const whereOptionsString = cache_utilty_1.default.setQueryOptions({ where: whereOptions });
                const cacheKey = cache_utilty_1.default.setKey(this.name, whereOptionsString, cacheName);
                let modelString = await repository_module_1.RepositoryModule.catchGetter({ key: cacheKey });
                if (!modelString) {
                    const newModel = await this.findOne(Object.assign(Object.assign({}, options), { where: whereOptions }));
                    modelString = JSON.stringify(newModel);
                    if (newModel)
                        repository_module_1.RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl });
                }
                const model = transformCacheToModel(this, modelString);
                if (!model && options.rejectOnEmpty) {
                    throw Error(`${this.notFoundMessage}`);
                }
                return model;
            }
        },
        _a.caches = caches,
        _a.modelTTL = 0,
        _a.notFoundMessage = 'Model Not Found',
        _a;
}
exports.base = base;
//# sourceMappingURL=base-model.js.map