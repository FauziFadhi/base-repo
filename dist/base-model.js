"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const common_1 = require("@nestjs/common");
const date_utility_1 = require("./date-utility");
const lodash_1 = require("lodash");
const repository_module_1 = require("./repository.module");
const sequelize_typescript_1 = require("sequelize-typescript");
const cache_utilty_1 = require("./cache-utilty");
function transformCacheToModel(modelClass, dataCache) {
    const modelData = JSON.parse(dataCache);
    if (!modelData)
        return null;
    const model = modelClass.build(modelData, { isNewRecord: false, raw: true, include: { all: true, nested: true } });
    return model;
}
function TransformCacheToModels(modelClass, dataCache) {
    const modelData = JSON.parse(dataCache);
    if (!(modelData === null || modelData === void 0 ? void 0 : modelData.length))
        return [];
    const models = modelClass.bulkBuild(modelData, { isNewRecord: false, raw: true, include: { all: true, nested: true } });
    return models;
}
function getMaxUpdateOptions(options) {
    if (!options)
        return {};
    const maxOptions = lodash_1.cloneDeep(options || {});
    maxOptions === null || maxOptions === void 0 ? true : delete maxOptions.order;
    return {
        where: maxOptions === null || maxOptions === void 0 ? void 0 : maxOptions.where,
        dataType: sequelize_typescript_1.DataType.DATE,
    };
}
class Model extends sequelize_typescript_1.Model {
    static async findOneCache(options = {}) {
        options = options !== null && options !== void 0 ? options : {};
        const TTL = (options === null || options === void 0 ? void 0 : options.ttl) || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        options === null || options === void 0 ? true : delete options.ttl;
        const rejectOnEmpty = options === null || options === void 0 ? void 0 : options.rejectOnEmpty;
        options === null || options === void 0 ? true : delete options.rejectOnEmpty;
        const scope = lodash_1.cloneDeep(this['_scope']);
        const defaultOptions = this['_defaultsOptions'](Object.assign(Object.assign({}, options), { limit: 1 }), scope);
        const optionsString = cache_utilty_1.default.setOneQueryOptions(defaultOptions);
        const keys = await repository_module_1.RepositoryModule.catchKeyGetter({ keyPattern: `*${this.name}*_${optionsString}*` });
        const firstKey = keys === null || keys === void 0 ? void 0 : keys[0];
        const key = firstKey === null || firstKey === void 0 ? void 0 : firstKey.substring(firstKey === null || firstKey === void 0 ? void 0 : firstKey.indexOf(":"));
        let modelString = key ? await repository_module_1.RepositoryModule.catchGetter({ key: key }) : null;
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
    static async findByPkCache(identifier, options = {}) {
        options = options !== null && options !== void 0 ? options : {};
        const TTL = (options === null || options === void 0 ? void 0 : options.ttl) || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        options === null || options === void 0 ? true : delete options.ttl;
        const rejectOnEmpty = options === null || options === void 0 ? void 0 : options.rejectOnEmpty;
        options === null || options === void 0 ? true : delete options.rejectOnEmpty;
        const scope = lodash_1.cloneDeep(this['_scope']);
        const defaultOptions = this['_defaultsOptions'](options, scope);
        const optionsString = cache_utilty_1.default
            .setOneQueryOptions(Object.assign(Object.assign({}, defaultOptions), { where: Object.assign({ [this['primaryKeyAttribute']]: identifier }, defaultOptions === null || defaultOptions === void 0 ? void 0 : defaultOptions.where) })) + 'pk';
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
    static async findAllCache(options = {}) {
        const TTL = (options === null || options === void 0 ? void 0 : options.ttl) || this['modelTTL'] || repository_module_1.RepositoryModule.defaultTTL;
        options === null || options === void 0 ? true : delete options.ttl;
        const maxUpdateOptions = getMaxUpdateOptions(options);
        const [maxUpdatedAt, count] = await Promise.all([
            this['rawAttributes']['updatedAt']
                ? this['max'](`${this.name}.updated_at`, maxUpdateOptions)
                : undefined,
            this['count'](options),
        ]);
        if (!count && !maxUpdatedAt)
            return TransformCacheToModels(this, '[]');
        const max = date_utility_1.DateUtility.convertDateTimeToEpoch(maxUpdatedAt) + +count;
        const scope = lodash_1.cloneDeep(this['_scope']);
        const defaultOptions = this['_defaultsOptions'](options, scope);
        const keyOpts = cache_utilty_1.default.setQueryOptions(defaultOptions);
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
    static scopes(options) {
        return this['scope'](options);
    }
}
exports.Model = Model;
Model.modelTTL = 0;
Model.defaultNotFoundMessage = (name) => `${name} data not found`;
Model.notFoundException = (message) => new common_1.NotFoundException(message);
Model.notFoundMessage = null;
//# sourceMappingURL=base-model.js.map