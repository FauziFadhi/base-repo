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
exports.BaseModel = void 0;
const date_utility_1 = require("./date-utility");
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
const cache_utilty_1 = require("./cache-utilty");
function setWhereOptions(whereOptions, attributes) {
    var _a;
    if (whereOptions && ((_a = Object.keys(whereOptions)) === null || _a === void 0 ? void 0 : _a.length) && !attributes)
        throw new Error(`cacheKey attributes not exists`);
    const newWhereOptions = attributes === null || attributes === void 0 ? void 0 : attributes.reduce((result, current) => {
        const currentPropValue = whereOptions[current];
        if (currentPropValue == undefined)
            throw new Error(`${[current]} value is missing`);
        return Object.assign(Object.assign({}, result), { [current]: whereOptions[current] });
    }, {});
    return newWhereOptions;
}
function setOrder(orders, orderCache) {
    if ((orders === null || orders === void 0 ? void 0 : orders.length) && !(orderCache === null || orderCache === void 0 ? void 0 : orderCache.length))
        throw new Error(`order for this cache not set`);
    orderCache === null || orderCache === void 0 ? void 0 : orderCache.forEach((order, index) => {
        if (order !== orders[index][0])
            throw new Error(`Order ${order} not set properly`);
    });
    return orders;
}
function setGroup(groups, groupCache) {
    if ((groups === null || groups === void 0 ? void 0 : groups.length) && !(groupCache === null || groupCache === void 0 ? void 0 : groupCache.length))
        throw new Error(`Group for this cache not set`);
    groupCache === null || groupCache === void 0 ? void 0 : groupCache.forEach((group, index) => {
        if (group !== groups[index])
            throw new Error(`Order ${group} not set properly`);
    });
    return groups;
}
function setOptions(options, cache) {
    const where = setWhereOptions(options === null || options === void 0 ? void 0 : options.where, cache.attributes);
    const order = setOrder(options === null || options === void 0 ? void 0 : options.order, cache.order);
    const having = setWhereOptions(options.having, cache.havingAttributes);
    const group = setGroup(options.group, cache.group);
    return { where, order, group, having };
}
function transformCacheToModel(modelClass, dataCache) {
    const modelData = JSON.parse(dataCache);
    if (!modelData)
        return null;
    const model = new modelClass(modelData, { isNewRecord: false });
    if (modelData.createdAt)
        model.setDataValue('createdAt', modelData.createdAt);
    if (modelData.updatedAt)
        model.setDataValue('updatedAt', modelData.updatedAt);
    return model;
}
function TransformCacheToModels(modelClass, dataCache) {
    const modelDatas = JSON.parse(dataCache);
    if (!(modelDatas === null || modelDatas === void 0 ? void 0 : modelDatas.length))
        return [];
    const models = modelClass.bulkBuild(modelDatas, { isNewRecord: false });
    return models.map((model, index) => {
        const modelData = modelDatas[index];
        if (modelData.createdAt)
            model.setDataValue('createdAt', modelData.createdAt);
        if (modelData.updatedAt)
            model.setDataValue('updatedAt', modelData.updatedAt);
        return model;
    });
}
class BaseModel extends sequelize_typescript_1.Model {
    static async findOneCache(cacheName, _a = { isThrow: false }) {
        var _b;
        var { isThrow, ttl } = _a, options = __rest(_a, ["isThrow", "ttl"]);
        const TTL = ttl || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        const cache = (_b = this['caches']) === null || _b === void 0 ? void 0 : _b[cacheName];
        if (!cache)
            throw new Error(`cache name '${cacheName}' not exists at model ${this.name}`);
        const cacheOptions = setOptions(options, cache);
        const optionsString = cache_utilty_1.default.setQueryOptions(cacheOptions);
        const cacheKey = cache_utilty_1.default.setKey(this.name, optionsString, cacheName);
        let modelString = await repository_module_1.RepositoryModule.catchGetter({ key: cacheKey });
        if (!modelString) {
            const newModel = await this['findOne'](cacheOptions);
            modelString = JSON.stringify(newModel);
            if (newModel)
                repository_module_1.RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl: TTL });
        }
        const model = transformCacheToModel(this, modelString);
        const modelNullOrDeleted = Boolean(!model || model.isDeleted);
        if (modelNullOrDeleted && isThrow) {
            throw Error(`${this['notFoundMessage']}`);
        }
        return model;
    }
    static async findByPkCache(identifier, { isThrow, ttl } = { isThrow: false, ttl: 0 }) {
        const TTL = ttl || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        const cacheKey = cache_utilty_1.default.setKey(`${this.name}`, identifier, 'id');
        let modelString = await repository_module_1.RepositoryModule.catchGetter({ key: cacheKey });
        if (!modelString) {
            const newModel = await this['findByPk'](identifier);
            modelString = JSON.stringify(newModel);
            if (newModel)
                repository_module_1.RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl: TTL });
        }
        const model = transformCacheToModel(this, modelString);
        const modelNullOrDeleted = Boolean(!model || model.isDeleted);
        if (modelNullOrDeleted && isThrow) {
            throw Error(`${this['notFoundMessage']}`);
        }
        return model;
    }
    static async findAllCache(_a) {
        var { ttl } = _a, options = __rest(_a, ["ttl"]);
        const TTL = ttl || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        const [maxUpdatedAt, count] = await Promise.all([
            this['max']('updatedAt', { where: options.where }),
            this['count'](options),
        ]);
        if (!count && !maxUpdatedAt)
            return TransformCacheToModels(this, '[]');
        const max = date_utility_1.DateUtility.convertDateTimeToEpoch(maxUpdatedAt) + +count;
        const keyOpts = cache_utilty_1.default.setQueryOptions(options);
        const keyTime = cache_utilty_1.default.setKey(this.name, keyOpts);
        let timeCached = await repository_module_1.RepositoryModule.catchGetter({ key: keyTime });
        let canFetch = false;
        if (!timeCached || max.toString() != timeCached) {
            canFetch = true;
            await repository_module_1.RepositoryModule.catchSetter({ key: keyTime, value: max.toString(), ttl: TTL });
            timeCached = max.toString();
        }
        const keyModel = cache_utilty_1.default.setKey(this.name, timeCached, keyOpts);
        let modelString = await repository_module_1.RepositoryModule.catchGetter({ key: keyModel });
        if (canFetch || !modelString) {
            const newModels = await this['findAll'](options);
            modelString = JSON.stringify(newModels);
            const newKeyModel = cache_utilty_1.default.setKey(this.name, max, keyOpts);
            repository_module_1.RepositoryModule.catchSetter({ key: newKeyModel, value: modelString, ttl: TTL });
        }
        return TransformCacheToModels(this, modelString);
    }
}
exports.BaseModel = BaseModel;
BaseModel.caches = {};
BaseModel.modelTTL = 0;
BaseModel.notFoundMessage = `${BaseModel.name} Model Not Found`;
//# sourceMappingURL=base-model.js.map