"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const common_1 = require("@nestjs/common");
const cache_utilty_1 = require("./cache-utilty");
const date_utility_1 = require("./date-utility");
const helpers_1 = require("./helpers");
const repository_module_1 = require("./repository.module");
class Repository {
    constructor(model, cacheModel) {
        this.cacheModel = null;
        this.cacheStore = null;
        this.db = null;
        this.MEDIUM_TTL = repository_module_1.RepositoryModule.defaultTTL;
        this.findByIdCache = async (id, isThrow = false, includeDeleted = false) => {
            return await this.findByOneAttributeCache({ name: 'id', value: id }, isThrow, includeDeleted);
        };
        this.model = model;
        this.cacheModel = cacheModel;
        this.setDbConfig(repository_module_1.RepositoryModule.sequelize);
        this.model.afterUpdate((model, options) => {
            this.cacheInvalidation(model, options, 'update');
        });
        this.model.afterDestroy((model, options) => {
            this.cacheInvalidation(model, options, 'destroy');
        });
    }
    cacheInvalidation(model, options, onWhat) {
        const previousModel = Object.assign(Object.assign({}, helpers_1.circularToJSON(model)), helpers_1.circularToJSON(model._previousDataValues));
        console.log(previousModel, 'invalidatedModel');
        if (options.transaction) {
            options.transaction.afterCommit(() => {
                this.invalidateAllCache(previousModel);
                console.log(`invalidate ${onWhat} transaction`);
            });
            return model;
        }
        console.log(`invalidate ${onWhat}`);
        this.invalidateAllCache(previousModel);
    }
    setKeyMultiAttribute(key) {
        const keyOpts = cache_utilty_1.default.setQueryOptions(key);
        return cache_utilty_1.default.setKey(this.getCacheModel(), keyOpts);
    }
    setInvalidateCache(key) {
        console.log('key', key);
        cache_utilty_1.default.invalidate(key, this.getCacheStore());
    }
    getNewModelClass(values, options) {
        return new this.model(values, options);
    }
    defaultThrow() {
        throw new common_1.HttpException(`${new this.model().constructor.name} data not Found`, 400);
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
    setDbConfig(db) {
        this.db = db;
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
        const allFindByCacheName = this.getAllFindByCacheName();
        console.log(allFindByCacheName);
        for (const func of allFindByCacheName) {
            const findByTextLength = 6;
            const cacheTextLength = 5;
            const attributeName = func.slice(findByTextLength, -cacheTextLength);
            console.log('attributeName', attributeName);
            const toCamelCase = attributeName.charAt(0).toLowerCase() + attributeName.slice(1);
            const key = this.setKeyOneAttribute(toCamelCase, modelClass[`${toCamelCase}`]);
            cache_utilty_1.default.invalidate(key, this.getCacheStore());
        }
    }
    async invalidateAllCache(modelClass) {
        this.invalidateAllFindByCache(modelClass);
        this.invalidateCache(modelClass);
        const key = cache_utilty_1.default.setKey(this.getCacheModel(), this.model.id);
        cache_utilty_1.default.invalidate(key, this.getCacheStore());
    }
    async paginate(options = {}) {
        return await this.model.findAndCountAll(Object.assign(Object.assign({}, options), { order: (options === null || options === void 0 ? void 0 : options.order) || [[this.model.primaryKeyAttribute, 'asc']] }));
    }
    async list(options = {}) {
        return await this.model.findAll(Object.assign(Object.assign({}, options), { order: (options === null || options === void 0 ? void 0 : options.order) || [[this.model.primaryKeyAttribute, 'asc']] }));
    }
    async listCache(options = {}, includeDeleted = false) {
        const [maxUpdatedAt, count] = await Promise.all([
            this.model.max('updatedAt', { where: options.where }),
            this.model.count({ where: options.where }),
        ]);
        const max = date_utility_1.DateUtility.convertDatetimeToEpoch(maxUpdatedAt) + +count;
        const keyOpts = cache_utilty_1.default.setQueryOptions(options);
        const keyTime = cache_utilty_1.default.setKey(this.cacheModel, keyOpts);
        let timeCached = await this.getCacheStore().get(keyTime);
        if (!timeCached) {
            await this.getCacheStore().set(keyTime, max, 'EX', this.MEDIUM_TTL);
            timeCached = max;
        }
        const key = cache_utilty_1.default.setKey(this.cacheModel, timeCached, keyOpts);
        let canFetch = false;
        if (max != timeCached) {
            canFetch = await cache_utilty_1.default.invalidate(key, this.getCacheStore());
            this.getCacheStore().set(keyTime, max, 'EX', this.MEDIUM_TTL);
        }
        let result = await this.getCacheStore().get(key);
        if (canFetch || !result) {
            const model = await this.list(options);
            result = JSON.stringify(model);
            const newKey = cache_utilty_1.default.setKey(this.cacheModel, max, keyOpts);
            await this.getCacheStore().set(newKey, result, 'EX', this.MEDIUM_TTL);
        }
        if (!includeDeleted) {
            return cache_utilty_1.default.setResult(result).filter(res => !res.isDeleted);
        }
        return cache_utilty_1.default.setResult(result);
    }
    getDataOrThrow(dataModel, isThrow, includeDeleted) {
        this.throwNullOrDeleted(dataModel, isThrow);
        if (!includeDeleted && (dataModel === null || dataModel === void 0 ? void 0 : dataModel.isDeleted))
            return null;
        return dataModel;
    }
    getDataOrThrowFromCache(resultCache, isThrow, includeDeleted) {
        const model = this.getDataModelFromCache(resultCache);
        return this.getDataOrThrow(model, isThrow, includeDeleted);
    }
    async findOne(options, isThrow = false, includeDeleted = false) {
        const model = await this.model.findOne(options);
        return this.getDataOrThrow(model, isThrow, includeDeleted);
    }
    async findById(id, isThrow = false, includeDeleted = false) {
        return await this.findOne({ where: { id } }, isThrow, includeDeleted);
    }
    async findByOneAttributeCache({ name, value }, isThrow = false, includeDeleted = false) {
        const key = this.setKeyOneAttribute(name, value);
        let result = await this.getCacheStore().get(key);
        if (!result) {
            const snakeCaseName = helpers_1.textToSnakeCase(name);
            let model = null;
            if (typeof value === 'string')
                model = await this.findOne({
                    where: this.getDbConfig().literal(`${snakeCaseName} = '${value}'`),
                }, false, true);
            else
                model = await this.findOne({
                    where: this.getDbConfig().literal(`${snakeCaseName} = ${value}`),
                }, false, true);
            if (model)
                await this.getCacheStore().set(key, JSON.stringify(model), 'EX', this.MEDIUM_TTL);
            result = JSON.stringify(model);
        }
        return this.getDataOrThrowFromCache(result, isThrow, includeDeleted);
    }
    async findByMultiAttributeCache(key, options, isThrow = false, includeDeleted = false) {
        let result = await this.getCacheStore().get(key);
        if (!result) {
            const model = await this.findOne(options, false, true);
            if (model)
                await this.getCacheStore().set(key, JSON.stringify(model), 'EX', this.MEDIUM_TTL);
            result = JSON.stringify(model);
        }
        return this.getDataOrThrowFromCache(result, isThrow, includeDeleted);
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
}
exports.Repository = Repository;
//# sourceMappingURL=base-repository.js.map