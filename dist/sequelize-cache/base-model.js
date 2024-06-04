"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const common_1 = require("@nestjs/common");
const lodash_1 = require("lodash");
const sequelize_cache_1 = require("./sequelize-cache");
const sequelize_typescript_1 = require("sequelize-typescript");
const cache_utilty_1 = require("./cache-utilty");
async function getCustomCache(key, ttl, setValue) {
    const generatedKey = cache_utilty_1.default.hash.update(JSON.stringify(key)).digest().toString(16);
    let cacheValue = await sequelize_cache_1.SequelizeCache.catchGetter({ key: generatedKey });
    if (cacheValue) {
        return JSON.parse(cacheValue);
    }
    const value = await setValue();
    if (!value)
        return null;
    cacheValue = JSON.stringify(value);
    sequelize_cache_1.SequelizeCache.catchSetter({ key: generatedKey, value: cacheValue, ttl });
    return value;
}
function transformCacheToModel(modelClass, dataCache, options) {
    const modelData = JSON.parse(dataCache);
    if (!modelData)
        return null;
    if (options.raw)
        return modelData;
    const model = modelClass.build(modelData, { isNewRecord: false, raw: true, include: options.include });
    return model;
}
function TransformCacheToModels(modelClass, dataCache, options) {
    const modelData = JSON.parse(dataCache);
    if (!modelData?.length)
        return [];
    if (options.raw)
        return modelData;
    const models = modelClass.bulkBuild(modelData, { isNewRecord: false, raw: true, include: options.include });
    return models;
}
function getMaxUpdateOptions(options) {
    if (!options)
        return {};
    const maxOptions = (0, lodash_1.cloneDeep)(options || {});
    delete maxOptions?.order;
    return {
        where: maxOptions?.where,
        dataType: sequelize_typescript_1.DataType.DATE,
    };
}
class Model extends sequelize_typescript_1.Model {
    static async findOneCache(options = {}) {
        options = options ?? {};
        const TTL = options?.ttl || this['modelTTL'] || sequelize_cache_1.SequelizeCache.defaultTTL;
        delete options?.ttl;
        const scope = (0, lodash_1.cloneDeep)(this['_scope']);
        const defaultOptions = this['_defaultsOptions']({ ...options, limit: 1 }, scope);
        const optionsString = cache_utilty_1.default.setOneQueryOptions(defaultOptions);
        const key = cache_utilty_1.default.setKey(this.name, optionsString, '*');
        let modelString = key ? await sequelize_cache_1.SequelizeCache.catchGetter({ key: key }) : null;
        if (!modelString) {
            const newModel = await this['findOne'](options);
            if (newModel) {
                modelString = JSON.stringify(newModel);
                const key = cache_utilty_1.default.setKey(this.name, optionsString, newModel[this['primaryKeyAttribute']]);
                sequelize_cache_1.SequelizeCache.catchSetter({ key, value: modelString, ttl: TTL });
                return newModel;
            }
        }
        if (!modelString) {
            const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name);
            this['rejectOnEmptyMode'](options, this['notFoundException'](message));
        }
        const include = options && 'include' in options ? options?.include : undefined;
        const model = transformCacheToModel(this, modelString, { include, raw: options.raw });
        return model;
    }
    static async findByPkCache(identifier, options = {}) {
        options = options ?? {};
        const TTL = options?.ttl || this['modelTTL'] || sequelize_cache_1.SequelizeCache.defaultTTL;
        delete options?.ttl;
        const scope = (0, lodash_1.cloneDeep)(this['_scope']);
        const defaultOptions = this['_defaultsOptions'](options, scope);
        const optionsString = cache_utilty_1.default
            .setOneQueryOptions({ ...defaultOptions, where: { [this['primaryKeyAttribute']]: identifier, ...defaultOptions?.where } }) + 'pk';
        const key = cache_utilty_1.default.setKey(this.name, optionsString, `${identifier}`);
        let modelString = await sequelize_cache_1.SequelizeCache.catchGetter({ key });
        if (!modelString) {
            const newModel = await this['findByPk'](identifier, options);
            if (newModel) {
                modelString = JSON.stringify(newModel);
                sequelize_cache_1.SequelizeCache.catchSetter({ key, value: modelString, ttl: TTL });
                return newModel;
            }
        }
        if (!modelString) {
            const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name);
            this['rejectOnEmptyMode'](options, this['notFoundException'](message));
        }
        const include = options && 'include' in options ? options?.include : undefined;
        const model = transformCacheToModel(this, modelString, { include, raw: options.raw });
        return model;
    }
    static rejectOnEmptyMode(options, modelException) {
        if (options.rejectOnEmpty)
            return;
        if (typeof options?.rejectOnEmpty == 'boolean' && options?.rejectOnEmpty) {
            throw modelException;
        }
        else if (typeof options?.rejectOnEmpty === 'object') {
            throw options.rejectOnEmpty;
        }
    }
    static async findAllCache(options) {
        const TTL = options?.ttl || this['modelTTL'] || sequelize_cache_1.SequelizeCache.defaultTTL;
        delete options?.ttl;
        const scope = (0, lodash_1.cloneDeep)(this['_scope']);
        const defaultOptions = this['_defaultsOptions'](options, scope);
        const keyOpts = cache_utilty_1.default.setQueryOptions(defaultOptions);
        const keyModel = cache_utilty_1.default.setKey(this.name, keyOpts);
        let modelString = await sequelize_cache_1.SequelizeCache.catchGetter({ key: keyModel });
        if (!modelString) {
            const newModels = await this['findAll'](options);
            if (!newModels?.length) {
                return [];
            }
            modelString = JSON.stringify(newModels);
            sequelize_cache_1.SequelizeCache.catchSetter({ key: keyModel, value: modelString, ttl: TTL });
            return newModels;
        }
        const include = options && 'include' in options ? options?.include : undefined;
        return TransformCacheToModels(this, modelString, { include, raw: options.raw });
    }
    static scopes(options) {
        return this['scope'](options);
    }
    static async countCache(ttl, options) {
        return getCustomCache({
            key: 'count',
            options,
            model: `${this.name}`,
        }, ttl, () => this.count(options));
    }
}
exports.Model = Model;
Model.modelTTL = 0;
Model.onUpdateAttribute = 'updatedAt';
Model.defaultNotFoundMessage = (name) => `${name} data not found`;
Model.notFoundException = (message) => new common_1.NotFoundException(message);
Model.notFoundMessage = null;
//# sourceMappingURL=base-model.js.map