"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
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
exports.Repository = exports.ListGetOptionsCache = exports.getOptionsCache = exports.GetOptions = void 0;
const common_1 = require("@nestjs/common");
const cache_utilty_1 = require("./cache-utilty");
const date_utility_1 = require("./date-utility");
const helpers_1 = require("./helpers");
const lodash_1 = require("lodash");
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
class GetOptions {
    constructor() {
        this.isThrow = false;
        this.includeDeleted = false;
    }
}
exports.GetOptions = GetOptions;
class getOptionsCache extends GetOptions {
    constructor() {
        super(...arguments);
        this.ttl = repository_module_1.RepositoryModule.defaultTTL;
    }
}
exports.getOptionsCache = getOptionsCache;
class ListGetOptionsCache {
    constructor() {
        this.ttl = repository_module_1.RepositoryModule.defaultTTL;
        this.includeDeleted = false;
    }
}
exports.ListGetOptionsCache = ListGetOptionsCache;
class Repository {
    constructor(model, cacheModel) {
        this.cacheModel = null;
        this.cacheStore = null;
        this.db = sequelize_typescript_1.Sequelize;
        this.findByIdCache = async (id, getOptions = {}) => {
            return await this.findByOneAttributeCache({ name: 'id', value: id }, Object.assign(Object.assign({}, new getOptionsCache()), getOptions));
        };
        this.model = model;
        this.cacheModel = cacheModel;
        this.model.afterUpdate((model, options) => {
            const previousModel = Object.assign(Object.assign({}, (0, helpers_1.circularToJSON)(model)), (0, helpers_1.circularToJSON)(model._previousDataValues));
            console.log(previousModel, 'invalidatedModel');
            if (options.transaction) {
                options.transaction.afterCommit(() => {
                    this.invalidateAllCache(previousModel);
                    console.log('invalidate update transaction');
                });
                return model;
            }
            console.log('invalidate update');
            this.invalidateAllCache(previousModel);
        });
        this.model.afterDestroy((model, options) => {
            const previousModel = Object.assign(Object.assign({}, (0, helpers_1.circularToJSON)(model)), (0, helpers_1.circularToJSON)(model._previousDataValues));
            console.log(previousModel, 'invalidatedModel');
            if (options.transaction) {
                options.transaction.afterCommit(() => {
                    this.invalidateAllCache(previousModel);
                    console.log('invalidate destroy transaction');
                });
                return model;
            }
            console.log('invalidate destroy');
            this.invalidateAllCache(previousModel);
        });
    }
    setKeyMultiAttribute(key) {
        const keyOpts = cache_utilty_1.default.setQueryOptions(key);
        return cache_utilty_1.default.setKey(this.getCacheModel(), keyOpts);
    }
    setInvalidateCache(key) {
        console.log('key', key);
    }
    getNewModelClass(values, options) {
        return new this.model(values, options);
    }
    defaultThrow() {
        throw new common_1.HttpException(`${new this.model().constructor.name} data not Found`, 404);
    }
    setCacheStore(cacheStore) {
        this.cacheStore = cacheStore;
    }
    getCacheStore() {
        if (!this.cacheStore)
            throw new common_1.HttpException('base cache Store at service is null', 500);
        return this.cacheStore;
    }
    getDbConfig() {
        if (!this.db)
            throw new common_1.HttpException('base DB Config at service is null', 500);
        return this.db;
    }
    getCacheModel() {
        if (!this.cacheModel)
            throw new common_1.HttpException('base cache model at service is null', 500);
        return this.cacheModel;
    }
    throwNullOrDeleted(dataModel, isThrow) {
        if ((!dataModel || (dataModel === null || dataModel === void 0 ? void 0 : dataModel.isDeleted)) && isThrow)
            this.defaultThrow();
    }
    setKeyOneAttribute(attributeName, attributeValue) {
        if (!this.db)
            throw new common_1.HttpException('base DB Config at service is null', 500);
        if (attributeName == 'id')
            return cache_utilty_1.default.setKey(`${this.cacheModel}`, attributeValue);
        return cache_utilty_1.default.setKey(`${this.cacheModel}_${attributeName}`, attributeValue);
    }
    getAllFindByCacheName() {
        const allFunction = Object.getOwnPropertyNames(this);
        return allFunction.filter(func => func.startsWith('findBy') && func.endsWith('Cache'));
    }
    async invalidateAllFindByCache(modelClass) {
        var e_1, _a;
        const allFindByCacheName = this.getAllFindByCacheName();
        console.log(allFindByCacheName);
        try {
            for (var allFindByCacheName_1 = __asyncValues(allFindByCacheName), allFindByCacheName_1_1; allFindByCacheName_1_1 = await allFindByCacheName_1.next(), !allFindByCacheName_1_1.done;) {
                const func = allFindByCacheName_1_1.value;
                const findByTextLength = 6;
                const cacheTextLength = 5;
                const attributeName = func.slice(findByTextLength, -cacheTextLength);
                console.log('attributeName', attributeName);
                const toCamelCase = attributeName.charAt(0).toLowerCase() + attributeName.slice(1);
                const key = this.setKeyOneAttribute(toCamelCase, modelClass[`${toCamelCase}`]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (allFindByCacheName_1_1 && !allFindByCacheName_1_1.done && (_a = allFindByCacheName_1.return)) await _a.call(allFindByCacheName_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    async invalidateAllCache(modelClass) {
        this.invalidateAllFindByCache(modelClass);
        this.invalidateCache(modelClass);
        const key = cache_utilty_1.default.setKey(this.getCacheModel(), modelClass.id);
    }
    async paginate(options) {
        var _a;
        options.includeDeleted = options.includeDeleted || false;
        options.where = (0, lodash_1.omitBy)(Object.assign({ isDeleted: this.model.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined }, options.where), lodash_1.isUndefined);
        return await this.model.findAndCountAll(Object.assign(Object.assign({}, options), { order: !(0, lodash_1.isEmpty)(options === null || options === void 0 ? void 0 : options.order) && (options === null || options === void 0 ? void 0 : options.order) || [[(_a = this.model) === null || _a === void 0 ? void 0 : _a.primaryKeyAttribute, 'asc']] }));
    }
    async list(options) {
        var _a;
        options.includeDeleted = options.includeDeleted || false;
        options.where = (0, lodash_1.omitBy)(Object.assign({ isDeleted: this.model.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined }, options.where), lodash_1.isUndefined);
        return await this.model.findAll(Object.assign(Object.assign({}, options), { order: !(0, lodash_1.isEmpty)(options === null || options === void 0 ? void 0 : options.order) && (options === null || options === void 0 ? void 0 : options.order) || [[(_a = this.model) === null || _a === void 0 ? void 0 : _a.primaryKeyAttribute, 'asc']] }));
    }
    async listCache(option = {}) {
        const _a = Object.assign(Object.assign({}, new ListGetOptionsCache()), option), { ttl, includeDeleted } = _a, options = __rest(_a, ["ttl", "includeDeleted"]);
        const [maxUpdatedAt, count] = await Promise.all([
            this.model.max('updatedAt', { where: options.where }),
            this.model.count({ where: options.where }),
        ]);
        const max = date_utility_1.DateUtility.convertDateTimeToEpoch(maxUpdatedAt) + +count;
        const keyOpts = cache_utilty_1.default.setQueryOptions(options);
        const keyTime = cache_utilty_1.default.setKey(this.cacheModel, keyOpts);
        let timeCached = await this.getCacheStore().get(keyTime);
        if (!timeCached) {
            await this.getCacheStore().set(keyTime, max, 'EX', ttl);
            timeCached = max;
        }
        const key = cache_utilty_1.default.setKey(this.cacheModel, timeCached, keyOpts);
        const canFetch = false;
        if (max != timeCached) {
            this.getCacheStore().set(keyTime, max, 'EX', ttl);
        }
        let result = await this.getCacheStore().get(key);
        if (canFetch || !result) {
            const model = await this.list(Object.assign(Object.assign({}, options), { includeDeleted: true }));
            result = JSON.stringify(model);
            const newKey = cache_utilty_1.default.setKey(this.cacheModel, max, keyOpts);
            await this.getCacheStore().set(newKey, result, 'EX', ttl);
        }
        if (!includeDeleted) {
            return cache_utilty_1.default.setResult(result).filter(res => !res.isDeleted);
        }
        return cache_utilty_1.default.setResult(result);
    }
    getDataOrThrow(dataModel, { isThrow, includeDeleted }) {
        this.throwNullOrDeleted(dataModel, isThrow);
        if (!includeDeleted && (dataModel === null || dataModel === void 0 ? void 0 : dataModel.isDeleted))
            return null;
        return dataModel;
    }
    getDataOrThrowFromCache(resultCache, getOptions) {
        const model = this.getDataModelFromCache(resultCache);
        return this.getDataOrThrow(model, getOptions);
    }
    async findOne(options) {
        const _a = Object.assign(Object.assign({}, new GetOptions()), options), { includeDeleted, isThrow } = _a, option = __rest(_a, ["includeDeleted", "isThrow"]);
        const model = await this.model.findOne(option);
        return this.getDataOrThrow(model, { includeDeleted, isThrow });
    }
    async findById(id, getOptions = {}) {
        return await this.findOne(Object.assign(Object.assign(Object.assign({}, new GetOptions()), getOptions), { where: { id } }));
    }
    async findByOneAttributeCache({ name, value }, getOptionsCaches = {}) {
        const _a = Object.assign(Object.assign({}, new getOptionsCache()), getOptionsCaches), { ttl, includeDeleted, isThrow } = _a, options = __rest(_a, ["ttl", "includeDeleted", "isThrow"]);
        const key = this.setKeyOneAttribute(name, value);
        let result = await this.getCacheStore().get(key);
        if (!result) {
            const snakeCaseName = (0, helpers_1.textToSnakeCase)(name);
            let model = null;
            if (typeof value === 'string')
                model = await this.findOne(Object.assign(Object.assign({}, options), { where: this.getDbConfig().literal(`${snakeCaseName} = '${value}'`), includeDeleted: true }));
            else
                model = await this.findOne(Object.assign(Object.assign({}, options), { where: this.getDbConfig().literal(`${snakeCaseName} = ${value}`), includeDeleted: true }));
            if (model)
                await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl);
            result = JSON.stringify(model);
        }
        return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow });
    }
    async findByMultiAttributeCache(key, getOptionsCaches) {
        const _a = Object.assign(Object.assign({}, new getOptionsCache()), getOptionsCaches), { ttl, includeDeleted, isThrow } = _a, options = __rest(_a, ["ttl", "includeDeleted", "isThrow"]);
        let result = await this.getCacheStore().get(key);
        if (!result) {
            const model = await this.findOne(Object.assign(Object.assign({}, options), { includeDeleted: true }));
            if (model)
                await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl);
            result = JSON.stringify(model);
        }
        return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow });
    }
    getDataModelFromCache(dataCache) {
        const model = JSON.parse(dataCache);
        if (!model)
            return null;
        const newModelClass = this.getNewModelClass(model, { isNewRecord: false });
        if (model.createdAt && model.updatedAt) {
            newModelClass.setDataValue('createdAt', model.createdAt);
            newModelClass.setDataValue('updatedAt', model.updatedAt);
        }
        return newModelClass;
    }
    async softDelete(dataModel, transaction) {
        if (!dataModel)
            throw new common_1.HttpException('data model null, nothing to update', 500);
        return await dataModel.update({ isDeleted: true }, transaction);
    }
    async createModel(values, transaction) {
        return await this.model.create(values, { transaction });
    }
    async bulkUpdate(values, options, transaction) {
        return await this.model.update(values, Object.assign(Object.assign({}, options), { transaction: (options === null || options === void 0 ? void 0 : options.transaction) || transaction, individualHooks: true }));
    }
    async bulkCreate(values, options, transaction) {
        return await this.model.bulkCreate(values, Object.assign(Object.assign({}, options), { transaction: (options === null || options === void 0 ? void 0 : options.transaction) || transaction }));
    }
    async findOrCreate(options, transaction) {
        return await this.model.findOrCreate(Object.assign(Object.assign({}, options), { transaction: (options === null || options === void 0 ? void 0 : options.transaction) || transaction }));
    }
    async findOrBuild(options, transaction) {
        return await this.model.findOrBuild(Object.assign(Object.assign({}, options), { transaction: (options === null || options === void 0 ? void 0 : options.transaction) || transaction }));
    }
    async count(options) {
        return await this.model.count(options);
    }
}
exports.Repository = Repository;
//# sourceMappingURL=base-repository.js.map