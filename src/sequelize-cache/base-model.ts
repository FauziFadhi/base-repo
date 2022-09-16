import { NotFoundException } from '@nestjs/common';
import { DateUtility } from 'date-utility';
import { cloneDeep } from 'lodash';
import * as crypto from 'crypto';
import { SequelizeCache } from './sequelize-cache';
import {
  AggregateOptions,
  Attributes,
  CountOptions,
  CountWithOptions,
  FindOptions,
  GroupedCountResultItem,
  Includeable,
  Model as SequelizeModel,
  ModelStatic,
  QueryOptions,
  ScopeOptions,
  WhereAttributeHash,
} from 'sequelize';
import { DataType, Model as TSModel } from 'sequelize-typescript';

import CacheUtility from './cache-utilty';

async function getCustomCache<T>(
  key: unknown,
  ttl: number,
  setValue: () => T | Promise<T>,
): Promise<T | null> {
  const hash = crypto.createHash('md5');
  const generatedKey = hash.update(JSON.stringify(key)).digest('base64');

  let cacheValue = await SequelizeCache.catchGetter({ key: generatedKey })

  if (cacheValue) {
    return JSON.parse(cacheValue as string) as T;
  }

  const value = await setValue();

  if (!value) return null;

  cacheValue = JSON.stringify(value);

  SequelizeCache.catchSetter({ key: generatedKey, value: cacheValue, ttl })

  return value as T;
}

type UnusedOptionsAttribute = 'lock' | 'skipLocked' | keyof Omit<QueryOptions, 'replacements' | 'bind' | 'type' | 'nest' | 'raw'>
export interface DefaultOptionsCache {
  /**
     * Throw if nothing was found.
   */
  rejectOnEmpty?: boolean | Error
}
export interface FindAllNestedOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute>, DefaultOptionsCache {
  ttl: number
}

export interface FindAllOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute | 'include'>, DefaultOptionsCache {
  ttl?: number
}
function transformCacheToModel(modelClass: any, dataCache: string, include?: Includeable | Includeable[]) {
  const modelData = JSON.parse(dataCache)

  if (!modelData) return null

  const model = modelClass.build(modelData, { isNewRecord: false, raw: true, include })

  return model
}

function TransformCacheToModels(modelClass: any, dataCache: string, include?: Includeable | Includeable[]) {
  const modelData = JSON.parse(dataCache)

  if (!modelData?.length) return []

  const models = modelClass.bulkBuild(modelData, { isNewRecord: false, raw: true, include })

  return models
}

function getMaxUpdateOptions(options: FindAllOptionsCache | FindAllNestedOptionsCache): AggregateOptions<unknown> {
  if(!options) return {};
  const maxOptions = cloneDeep(options || {})
  delete maxOptions?.order

  return {
    where: maxOptions?.where,
    dataType: DataType.DATE,
  }
}

// function cleanIncludeAttribute(include: IncludeOptions | IncludeOptions[]) {
//   if(!include)
//     return;
    
//   if(Array.isArray(include)) {
//     include.forEach((include) => {
//       include.attributes = [];
//       delete include.order

//       if(include?.through)
//         cleanIncludeAttribute(include?.through as IncludeOptions)
      
//       if(include?.include) 
//         cleanIncludeAttribute(include.include as IncludeOptions)
//     })
//   } else {
//     include.attributes = [];
//     delete include.order

//     if(include?.through)
//       cleanIncludeAttribute(include?.through as IncludeOptions)

//     if(include?.include) 
//         cleanIncludeAttribute(include.include as IncludeOptions)
//   }
// }

export class Model<TAttributes extends {} = any, TCreate extends {} = TAttributes>
  extends TSModel<TAttributes, TCreate> {

  static modelTTL = 0
  static onUpdateAttribute = 'updatedAt'
  private static defaultNotFoundMessage = (name: string): string => `${name} data not found`
  private static notFoundException = (message: string): Error => new NotFoundException(message)
  static notFoundMessage = null

  /**
   * should define first object `caches` at model definition
   * example: ```js
   * const caches = [
   * {name: 'ById' attributes: ['isDeleted','id']}
   * ]
   * ```
   * @param this 
   * @param cacheName based on values that implemented at model definition 
   * @param options 
   * @returns 
   */
  static async findOneCache<T extends Model>(this: { new(): T },
    options?: FindAllNestedOptionsCache<T['_attributes']>,
  ): Promise<T> 
  static async findOneCache<T extends Model>(this: { new(): T },
    options?: FindAllOptionsCache<T['_attributes']>,
  ): Promise<T> 
  static async findOneCache<T extends Model>(this: { new(): T },
    options: FindAllNestedOptionsCache<T['_attributes']> | FindAllOptionsCache<T['_attributes']> = {},
  ): Promise<T> 
  {

    options = options ?? {} as any
    const TTL = options?.ttl || this['modelTTL'] || SequelizeCache.defaultTTL
    delete options?.ttl
    const rejectOnEmpty = options?.rejectOnEmpty
    delete options?.rejectOnEmpty

    const scope = cloneDeep(this['_scope'])
    const defaultOptions = this['_defaultsOptions']({...options, limit: 1 }, scope)

    const optionsString = CacheUtility.setOneQueryOptions(defaultOptions)
    const keys = await SequelizeCache.catchKeyGetter({ keyPattern: `*:${this.name}_*${optionsString}*` })
    const firstKey = keys?.[0];
    const key = firstKey?.substring(firstKey?.indexOf(":"))


    let modelString = key ? await SequelizeCache.catchGetter({ key: key }) : null

    if (!modelString) {
      const newModel = await this['findOne'](options)
      modelString = JSON.stringify(newModel)


      if (newModel) {
        const key = CacheUtility.setKey(this.name, optionsString, newModel[this['primaryKeyAttribute']])
        SequelizeCache.catchSetter({ key, value: modelString, ttl: TTL })
      }
    }
    const include = options && 'include' in options ? options?.include : undefined
    const model = transformCacheToModel(this, modelString, include)

    if (!model) {
      const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name)
      this['rejectOnEmptyMode']({ rejectOnEmpty }, this['notFoundException'](message))
    }

    return model
  }

  /**
   * find cache by pk of the model
   * @param this 
   * @param identifier 
   * @param {isThrow, ttl} 
   * @returns 
   */
  static async findByPkCache<T extends Model>(this: { new(): T },
    identifier: string | number,
    options?: Omit<FindAllNestedOptionsCache<T['_attributes']>, 'where'>,
  ): Promise<T>
  static async findByPkCache<T extends Model>(this: { new(): T },
    identifier: string | number,
    options?: Omit<FindAllOptionsCache<T['_attributes']>, 'where'>,
  ): Promise<T>
  static async findByPkCache<T extends Model>(this: { new(): T },
    identifier: string | number,
    options:
      Omit<FindAllNestedOptionsCache<T['_attributes']>, 'where'>
      | Omit<FindAllOptionsCache<T['_attributes']>, 'where'> = {},
  ): Promise<T> {

    options = options ?? {} as any

    const TTL = options?.ttl || this['modelTTL'] || SequelizeCache.defaultTTL
    delete options?.ttl
    const rejectOnEmpty = options?.rejectOnEmpty
    delete options?.rejectOnEmpty

    const scope = cloneDeep(this['_scope'])
    const defaultOptions = this['_defaultsOptions'](options, scope)

    const optionsString = CacheUtility
      .setOneQueryOptions({ ...defaultOptions, where: { [this['primaryKeyAttribute']]: identifier, ...defaultOptions?.where } }) + 'pk'
    const key = CacheUtility.setKey(this.name, optionsString, `${identifier}`)

    let modelString = await SequelizeCache.catchGetter({ key })
    if (!modelString) {

      const newModel = await this['findByPk'](identifier, options)
      modelString = JSON.stringify(newModel)

      if (newModel) {
        SequelizeCache.catchSetter({ key, value: modelString, ttl: TTL })
      }
    }

    const include = options && 'include' in options ? options?.include : undefined
    const model = transformCacheToModel(this, modelString, include)

    if (!model) {
      const message = this['notFoundMessage'] || this['defaultNotFoundMessage'](this.name)
      this['rejectOnEmptyMode']({ rejectOnEmpty }, this['notFoundException'](message))
    }

    return model
  }

  private static rejectOnEmptyMode(options: { rejectOnEmpty: boolean | Error }, modelException: Error): void {
    if (typeof options?.rejectOnEmpty == 'boolean' && options?.rejectOnEmpty) {
      throw modelException
    }
    else if (typeof options?.rejectOnEmpty === 'object') {
      throw options.rejectOnEmpty;
    }
  }

  static async findAllCache<T extends Model>(this: { new(): T },
    options?: FindAllNestedOptionsCache<T['_attributes']>,
  ): Promise<T[]> 
  static async findAllCache<T extends Model>(this: { new(): T },
    options?: FindAllOptionsCache<T['_attributes']>,
  ): Promise<T[]> 
  static async findAllCache<T extends Model>(this: { new(): T },
    options: FindAllNestedOptionsCache<T['_attributes']> | FindAllOptionsCache<T['_attributes']> = {},
  ): Promise<T[]> 
  {

    const TTL = options?.ttl || this['modelTTL'] || SequelizeCache.defaultTTL
    delete options?.ttl

    const maxUpdateOptions = getMaxUpdateOptions(options);

    const onUpdateAttribute = this['getAttributes']()?.[this['onUpdateAttribute']];
    const maxUpdatedAtPromise = onUpdateAttribute?.field
    ? getCustomCache({key: 'max', maxUpdateOptions}, 2, () => (this['max'](`${this.name}.${onUpdateAttribute?.field}`, maxUpdateOptions))) 
    : undefined

    // get max updatedAt on model
    const [maxUpdatedAt, count] = await Promise.all([
      maxUpdatedAtPromise,
      this['countCache'](2, options),
    ])

    if (!count && !maxUpdatedAt) return TransformCacheToModels(this, '[]')

    const max = DateUtility.convertDateTimeToEpoch(new Date(maxUpdatedAt)) + +count

    const scope = cloneDeep(this['_scope'])
    const defaultOptions = this['_defaultsOptions'](options, scope)
    // setting up key for FindOptions
    const keyOpts = CacheUtility.setQueryOptions(defaultOptions);

    // get what time is cached on this model based on keyOpts
    const keyTime = CacheUtility.setKey(this.name, keyOpts)
    let timeCached = await SequelizeCache.catchGetter({ key: keyTime })

    let canFetch = false
    // set time cache if timeCached is null
    if (!timeCached || max.toString() != timeCached) {
      canFetch = true

      await SequelizeCache.catchSetter({ key: keyTime, value: max.toString(), ttl: TTL })
      timeCached = max.toString()
    }

    // set key for get model
    const keyModel = CacheUtility.setKey(this.name, timeCached, keyOpts)
    // get the model result based on key
    let modelString = await SequelizeCache.catchGetter({ key: keyModel })

    // check if result is null or can fetch
    // then can fetch row on database
    if (canFetch || !modelString) {
      // fetch row on models
      const newModels = await this['findAll'](options)
      modelString = JSON.stringify(newModels)

      // set cache model based on new key
      const newKeyModel = CacheUtility.setKey(this.name, max, keyOpts)
      SequelizeCache.catchSetter({ key: newKeyModel, value: modelString, ttl: TTL })
    }

    const include = options && 'include' in options ? options?.include : undefined
    return TransformCacheToModels(this, modelString, include)
  }

  static scopes<M extends SequelizeModel>(
    this: ModelStatic<M>,
    options?: string | ScopeOptions | readonly (string | ScopeOptions)[] | WhereAttributeHash<M>
  ): typeof Model & { new(): M } {
    return this['scope'](options) as any
  }

  static async countCache<M extends Model>(
    this: ModelStatic<M>,
    ttl: number,
    options?: Omit<CountOptions<Attributes<M>>, 'group'>
  ): Promise<number>;
  static async countCache<M extends Model>(
    this: ModelStatic<M>,
    ttl: number,
    options: CountWithOptions<Attributes<M>>
  ): Promise<GroupedCountResultItem[]>;
  static async countCache<M extends Model>(
    this: ModelStatic<M>,
    ttl: number,
    options?: Omit<CountOptions<Attributes<M>>, 'group'> | CountWithOptions<Attributes<M>>
  ): Promise<number | GroupedCountResultItem[]> {
    return getCustomCache({
      key: 'count',
      options,
    }, ttl, () =>  this.count(options))
  }
}



