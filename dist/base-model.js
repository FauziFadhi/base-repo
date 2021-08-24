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
const common_1 = require("@nestjs/common");
const date_utility_1 = require("./date-utility");
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
const cache_utilty_1 = require("./cache-utilty");
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
    const modelData = JSON.parse(dataCache);
    if (!(modelData === null || modelData === void 0 ? void 0 : modelData.length))
        return [];
    const models = modelClass.bulkBuild(modelData, { isNewRecord: false });
    return models.map((model, index) => {
        const data = modelData[index];
        if (data.createdAt)
            model.setDataValue('createdAt', data.createdAt);
        if (data.updatedAt)
            model.setDataValue('updatedAt', data.updatedAt);
        return model;
    });
}
class BaseModel extends sequelize_typescript_1.Model {
    static async findOneCache(_a) {
        var { ttl } = _a, options = __rest(_a, ["ttl"]);
        const TTL = ttl || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        const rejectOnEmpty = options === null || options === void 0 ? void 0 : options.rejectOnEmpty;
        options === null || options === void 0 ? true : delete options.rejectOnEmpty;
        const optionsString = cache_utilty_1.default.setOneQueryOptions(options);
        const keys = await repository_module_1.RepositoryModule.catchKeyGetter({ keyPattern: `*${this.name}*_${optionsString}*` });
        const firstKey = keys === null || keys === void 0 ? void 0 : keys[0];
        const key = firstKey === null || firstKey === void 0 ? void 0 : firstKey.substring(firstKey.indexOf(":"));
        let modelString = await repository_module_1.RepositoryModule.catchGetter({ key: key });
        if (!modelString) {
            const newModel = await this['findOne'](options);
            modelString = JSON.stringify(newModel);
            if (newModel) {
                const key = cache_utilty_1.default.setKey(this.name, optionsString, newModel[this['primaryKeyAttribute']]);
                repository_module_1.RepositoryModule.catchSetter({ key, value: modelString, ttl: TTL });
            }
        }
        const model = transformCacheToModel(this, modelString);
        if (!model) {
            const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name);
            this['rejectOnEmptyMode']({ rejectOnEmpty }, this['notFoundException'](message));
        }
        return model;
    }
    static async findByPkCache(identifier, options) {
        const TTL = (options === null || options === void 0 ? void 0 : options.ttl) || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        options === null || options === void 0 ? true : delete options.ttl;
        const rejectOnEmpty = options === null || options === void 0 ? void 0 : options.rejectOnEmpty;
        options === null || options === void 0 ? true : delete options.rejectOnEmpty;
        const optionsString = cache_utilty_1.default
            .setOneQueryOptions(Object.assign(Object.assign({}, options), { where: { [this['primaryKeyAttribute']]: identifier } })) + 'pk';
        const key = cache_utilty_1.default.setKey(this.name, optionsString, `${identifier}`);
        let modelString = await repository_module_1.RepositoryModule.catchGetter({ key });
        if (!modelString) {
            const newModel = await this['findByPk'](identifier, options);
            modelString = JSON.stringify(newModel);
            if (newModel) {
                repository_module_1.RepositoryModule.catchSetter({ key, value: modelString, ttl: TTL });
            }
        }
        const model = transformCacheToModel(this, modelString);
        if (!model) {
            const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name);
            this['rejectOnEmptyMode']({ rejectOnEmpty }, this['notFoundException'](message));
        }
        return model;
    }
    static rejectOnEmptyMode(options, modelException) {
        if (typeof (options === null || options === void 0 ? void 0 : options.rejectOnEmpty) == 'boolean' && (options === null || options === void 0 ? void 0 : options.rejectOnEmpty)) {
            throw modelException;
        }
        else if (typeof (options === null || options === void 0 ? void 0 : options.rejectOnEmpty) === 'object') {
            throw options.rejectOnEmpty;
        }
    }
    static async findAllCache(_a) {
        var { ttl } = _a, options = __rest(_a, ["ttl"]);
        const TTL = ttl || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        const [maxUpdatedAt, count] = await Promise.all([
            this['max']('updatedAt', options),
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
BaseModel.defaultNotFoundMessage = (name) => `${name} data not found`;
BaseModel.notFoundException = (message) => new common_1.NotFoundException(message);
BaseModel.notFoundMessage = null;
//# sourceMappingURL=base-model.js.map