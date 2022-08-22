"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const common_1 = require("@nestjs/common");
const date_utility_1 = require("../date-utility");
const lodash_1 = require("lodash");
const crypto = require("crypto");
const sequelize_cache_1 = require("./sequelize-cache");
const sequelize_typescript_1 = require("sequelize-typescript");
const cache_utilty_1 = require("./cache-utilty");
async function getCustomCache(key, ttl, setValue) {
    const hash = crypto.createHash('md5');
    const generatedKey = hash.update(JSON.stringify(key)).digest('base64');
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
function transformCacheToModel(modelClass, dataCache, include) {
    const modelData = JSON.parse(dataCache);
    if (!modelData)
        return null;
    const model = modelClass.build(modelData, { isNewRecord: false, raw: true, include });
    return model;
}
function TransformCacheToModels(modelClass, dataCache, include) {
    const modelData = JSON.parse(dataCache);
    if (!modelData?.length)
        return [];
    const models = modelClass.bulkBuild(modelData, { isNewRecord: false, raw: true, include });
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
        const rejectOnEmpty = options?.rejectOnEmpty;
        delete options?.rejectOnEmpty;
        const scope = (0, lodash_1.cloneDeep)(this['_scope']);
        const defaultOptions = this['_defaultsOptions']({ ...options, limit: 1 }, scope);
        const optionsString = cache_utilty_1.default.setOneQueryOptions(defaultOptions);
        const keys = await sequelize_cache_1.SequelizeCache.catchKeyGetter({ keyPattern: `*${this.name}*_${optionsString}*` });
        const firstKey = keys?.[0];
        const key = firstKey?.substring(firstKey?.indexOf(":"));
        let modelString = key ? await sequelize_cache_1.SequelizeCache.catchGetter({ key: key }) : null;
        if (!modelString) {
            const newModel = await this['findOne'](options);
            modelString = JSON.stringify(newModel);
            if (newModel) {
                const key = cache_utilty_1.default.setKey(this.name, optionsString, newModel[this['primaryKeyAttribute']]);
                sequelize_cache_1.SequelizeCache.catchSetter({ key, value: modelString, ttl: TTL });
            }
        }
        const include = options && 'include' in options ? options?.include : undefined;
        const model = transformCacheToModel(this, modelString, include);
        if (!model) {
            const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name);
            this['rejectOnEmptyMode']({ rejectOnEmpty }, this['notFoundException'](message));
        }
        return model;
    }
    static async findByPkCache(identifier, options = {}) {
        options = options ?? {};
        const TTL = options?.ttl || this['modelTTL'] || sequelize_cache_1.SequelizeCache.defaultTTL;
        delete options?.ttl;
        const rejectOnEmpty = options?.rejectOnEmpty;
        delete options?.rejectOnEmpty;
        const scope = (0, lodash_1.cloneDeep)(this['_scope']);
        const defaultOptions = this['_defaultsOptions'](options, scope);
        const optionsString = cache_utilty_1.default
            .setOneQueryOptions({ ...defaultOptions, where: { [this['primaryKeyAttribute']]: identifier, ...defaultOptions?.where } }) + 'pk';
        const key = cache_utilty_1.default.setKey(this.name, optionsString, `${identifier}`);
        let modelString = await sequelize_cache_1.SequelizeCache.catchGetter({ key });
        if (!modelString) {
            const newModel = await this['findByPk'](identifier, options);
            modelString = JSON.stringify(newModel);
            if (newModel) {
                sequelize_cache_1.SequelizeCache.catchSetter({ key, value: modelString, ttl: TTL });
            }
        }
        const include = options && 'include' in options ? options?.include : undefined;
        const model = transformCacheToModel(this, modelString, include);
        if (!model) {
            const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name);
            this['rejectOnEmptyMode']({ rejectOnEmpty }, this['notFoundException'](message));
        }
        return model;
    }
    static rejectOnEmptyMode(options, modelException) {
        if (typeof options?.rejectOnEmpty == 'boolean' && options?.rejectOnEmpty) {
            throw modelException;
        }
        else if (typeof options?.rejectOnEmpty === 'object') {
            throw options.rejectOnEmpty;
        }
    }
    static async findAllCache(options = {}) {
        const TTL = options?.ttl || this['modelTTL'] || sequelize_cache_1.SequelizeCache.defaultTTL;
        delete options?.ttl;
        const maxUpdateOptions = getMaxUpdateOptions(options);
        const [maxUpdatedAt, count] = await Promise.all([
            this['rawAttributes']['updatedAt']
                ? this['max'](`${this.name}.updated_at`, maxUpdateOptions)
                : undefined,
            this['countCache'](options),
        ]);
        if (!count && !maxUpdatedAt)
            return TransformCacheToModels(this, '[]');
        const max = date_utility_1.DateUtility.convertDateTimeToEpoch(maxUpdatedAt) + +count;
        const scope = (0, lodash_1.cloneDeep)(this['_scope']);
        const defaultOptions = this['_defaultsOptions'](options, scope);
        const keyOpts = cache_utilty_1.default.setQueryOptions(defaultOptions);
        const keyTime = cache_utilty_1.default.setKey(this.name, keyOpts);
        let timeCached = await sequelize_cache_1.SequelizeCache.catchGetter({ key: keyTime });
        let canFetch = false;
        if (!timeCached || max.toString() != timeCached) {
            canFetch = true;
            await sequelize_cache_1.SequelizeCache.catchSetter({ key: keyTime, value: max.toString(), ttl: TTL });
            timeCached = max.toString();
        }
        const keyModel = cache_utilty_1.default.setKey(this.name, timeCached, keyOpts);
        let modelString = await sequelize_cache_1.SequelizeCache.catchGetter({ key: keyModel });
        if (canFetch || !modelString) {
            const newModels = await this['findAll'](options);
            modelString = JSON.stringify(newModels);
            const newKeyModel = cache_utilty_1.default.setKey(this.name, max, keyOpts);
            sequelize_cache_1.SequelizeCache.catchSetter({ key: newKeyModel, value: modelString, ttl: TTL });
        }
        const include = options && 'include' in options ? options?.include : undefined;
        return TransformCacheToModels(this, modelString, include);
    }
    static scopes(options) {
        return this['scope'](options);
    }
    static async countCache(options) {
        return getCustomCache({
            key: 'count',
            options,
        }, 2, () => {
            return this.count(options);
        });
    }
}
exports.Model = Model;
Model.modelTTL = 0;
Model.defaultNotFoundMessage = (name) => `${name} data not found`;
Model.notFoundException = (message) => new common_1.NotFoundException(message);
Model.notFoundMessage = null;
//# sourceMappingURL=base-model.js.map