"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.BaseModel = void 0;
const common_1 = require("@nestjs/common");
const cache_utilty_1 = require("./cache-utilty");
const date_utility_1 = require("./date-utility");
const helpers_1 = require("./helpers");
const lodash_1 = require("lodash");
const sequelize_typescript_1 = require("sequelize-typescript");
const base_repository_1 = require("./base-repository");
class BaseModel extends sequelize_typescript_1.Model {
    static invalidateCache(model) {
    }
    static setRedisClient() {
    }
    static invalidateModelCache(model, options) {
        const previousModel = Object.assign(Object.assign({}, helpers_1.circularToJSON(model)), helpers_1.circularToJSON(model._previousDataValues));
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
    }
    static setKeyOneAttribute(attributeName, attributeValue) {
        if (!this.db)
            throw new common_1.InternalServerErrorException('base DB Config at service is null');
        if (attributeName == 'id')
            return cache_utilty_1.default.setKey(`${this.cacheModel}`, attributeValue);
        return cache_utilty_1.default.setKey(`${this.cacheModel}_${attributeName}`, attributeValue);
    }
    static setKeyMultiAttribute(key) {
        const keyOpts = cache_utilty_1.default.setQueryOptions(key);
        return cache_utilty_1.default.setKey(this.getCacheModel(), keyOpts);
    }
    static setInvalidateCache(key) {
        console.log('key', key);
        cache_utilty_1.default.invalidate(key, this.getCacheStore());
    }
    static getNewModelClass(values, options) {
        return new this(values, options);
    }
    static defaultThrow() {
        throw new common_1.BadRequestException(`${new this().constructor.name} data not Found`);
    }
    static setCacheStore(cacheStore) {
        this.cacheStore = cacheStore;
    }
    static getCacheStore() {
        this.setRedisClient();
        if (!this.cacheStore)
            throw new common_1.InternalServerErrorException('base cache Store at service is null');
        return this.cacheStore;
    }
    static getDbConfig() {
        if (!this.db)
            throw new common_1.InternalServerErrorException('base DB Config at service is null');
        return this.db;
    }
    static getCacheModel() {
        if (!this.cacheModel)
            throw new common_1.InternalServerErrorException('base cache model at service is null');
        return this.cacheModel;
    }
    static throwNullOrDeleted(dataModel, isThrow) {
        if ((!dataModel || (dataModel === null || dataModel === void 0 ? void 0 : dataModel.isDeleted)) && isThrow)
            this.defaultThrow();
    }
    static getAllFindByCacheName() {
        const allFunction = Object.getOwnPropertyNames(this);
        return allFunction.filter(func => func.startsWith('findBy') && func.endsWith('Cache'));
    }
    static async invalidateAllFindByCache(modelClass) {
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
                cache_utilty_1.default.invalidate(key, this.getCacheStore());
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
    static async invalidateAllCache(modelClass) {
        this.invalidateAllFindByCache(modelClass);
        this.invalidateCache(modelClass);
        const key = cache_utilty_1.default.setKey(this.getCacheModel(), modelClass.id);
        cache_utilty_1.default.invalidate(key, this.getCacheStore());
    }
    static async paginate(options) {
        options.includeDeleted = options.includeDeleted || false;
        options.where = Object.assign(Object.assign({}, lodash_1.pickBy({ isDeleted: this.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined })), options.where);
        return await this.findAndCountAll(Object.assign(Object.assign({}, options), { order: (options === null || options === void 0 ? void 0 : options.order) || [[this.primaryKeyAttribute, 'asc']] }));
    }
    static async list(options) {
        options.includeDeleted = options.includeDeleted || false;
        options.where = Object.assign(Object.assign({}, lodash_1.pickBy({ isDeleted: this.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined })), options.where);
        return await this.findAll(Object.assign(Object.assign({}, options), { order: (options === null || options === void 0 ? void 0 : options.order) || [[this.primaryKeyAttribute, 'asc']] }));
    }
    static async listCache(option = {}) {
        const _a = Object.assign(Object.assign({}, new base_repository_1.ListGetOptionsCache()), option), { ttl, includeDeleted } = _a, options = __rest(_a, ["ttl", "includeDeleted"]);
        const [maxUpdatedAt, count] = await Promise.all([
            this.max('updatedAt', { where: options.where }),
            this.count({ where: options.where }),
        ]);
        const max = date_utility_1.DateUtility.convertDatetimeToEpoch(maxUpdatedAt) + +count;
        const keyOpts = cache_utilty_1.default.setQueryOptions(options);
        const keyTime = cache_utilty_1.default.setKey(this.cacheModel, keyOpts);
        let timeCached = await this.getCacheStore().get(keyTime);
        if (!timeCached) {
            await this.getCacheStore().set(keyTime, max, 'EX', ttl);
            timeCached = max;
        }
        const key = cache_utilty_1.default.setKey(this.cacheModel, timeCached, keyOpts);
        let canFetch = false;
        if (max != timeCached) {
            canFetch = await cache_utilty_1.default.invalidate(key, this.getCacheStore());
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
    static getDataOrThrow(dataModel, { isThrow, includeDeleted }) {
        this.throwNullOrDeleted(dataModel, isThrow);
        if (!includeDeleted && (dataModel === null || dataModel === void 0 ? void 0 : dataModel.isDeleted))
            return null;
        return dataModel;
    }
    static getDataOrThrowFromCache(resultCache, getOptions) {
        const model = this.getDataModelFromCache(resultCache);
        return this.getDataOrThrow(model, getOptions);
    }
    static createInstance(model) {
        return model;
    }
    static async getOne(options) {
        const _a = Object.assign(Object.assign({}, new base_repository_1.GetOptions()), options), { includeDeleted, isThrow } = _a, option = __rest(_a, ["includeDeleted", "isThrow"]);
        const model = await this.findOne(option);
        console.log('baseModel', model);
        return BaseModel.getDataOrThrow(model, { includeDeleted, isThrow });
    }
    static async findById(id, getOptions = {}) {
        return await this.getOne(Object.assign(Object.assign(Object.assign({}, new base_repository_1.GetOptions()), getOptions), { where: { id } }));
    }
    static async findByIdCache(id, getOptions = {}) {
        return await this.findByOneAttributeCache({ name: 'id', value: id }, Object.assign(Object.assign({}, new base_repository_1.getOptionsCache()), getOptions));
    }
    static async findByOneAttributeCache({ name, value }, getOptionsCaches = {}) {
        const _a = Object.assign(Object.assign({}, new base_repository_1.getOptionsCache()), getOptionsCaches), { ttl, includeDeleted, isThrow } = _a, options = __rest(_a, ["ttl", "includeDeleted", "isThrow"]);
        const key = this.setKeyOneAttribute(name, value);
        console.log('baseModel', key);
        let result = await this.getCacheStore().get(key);
        if (!result) {
            const snakeCaseName = helpers_1.textToSnakeCase(name);
            let model = null;
            if (typeof value === 'string')
                model = await this.getOne(Object.assign(Object.assign({}, options), { where: this.getDbConfig().literal(`${snakeCaseName} = '${value}'`), includeDeleted: true }));
            else
                model = await this.getOne(Object.assign(Object.assign({}, options), { where: this.getDbConfig().literal(`${snakeCaseName} = ${value}`), includeDeleted: true }));
            if (model)
                await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl);
            result = JSON.stringify(model);
        }
        return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow });
    }
    static async findByMultiAttributeCache(key, getOptionsCaches) {
        const _a = Object.assign(Object.assign({}, new base_repository_1.getOptionsCache()), getOptionsCaches), { ttl, includeDeleted, isThrow } = _a, options = __rest(_a, ["ttl", "includeDeleted", "isThrow"]);
        let result = await this.getCacheStore().get(key);
        if (!result) {
            const model = await this.getOne(Object.assign(Object.assign({}, options), { includeDeleted: true }));
            if (model)
                await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl);
            result = JSON.stringify(model);
        }
        return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow });
    }
    static getDataModelFromCache(dataCache) {
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
}
BaseModel.db = sequelize_typescript_1.Sequelize;
BaseModel.cacheModel = BaseModel.name;
__decorate([
    sequelize_typescript_1.AfterUpdate,
    sequelize_typescript_1.AfterDestroy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BaseModel, "invalidateModelCache", null);
exports.BaseModel = BaseModel;
//# sourceMappingURL=base-model.js.map