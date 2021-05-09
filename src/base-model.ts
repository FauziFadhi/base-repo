import { DateUtility } from 'date-utility';
import { RepositoryModule } from 'repository.module';
import { FindOptions, WhereAttributeHash, WhereOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';

import CacheUtility, { CacheKey } from './cache-utilty';

type ExtractRouteParams<T extends PropertyKey> = string extends T
  ? Record<string, string>
  : { [k in T]?: unknown }

export interface DefaultOptionsCache {
  ttl?: number
  isThrow?: boolean
}
export interface FindOptionsCache<T extends PropertyKey> extends DefaultOptionsCache {
  where?: WhereAttributeHash<ExtractRouteParams<T>>
  order?: [string, string][]
  having?: WhereAttributeHash<any>
  group?: string[]
}

export interface FindAllOptionsCache<T = any> extends Omit<FindOptions<T>, 'lock' | 'raw'> {
  ttl?: number
}

function setWhereOptions<T>(whereOptions: WhereOptions<T>, attributes: readonly string[]): T {
  if (whereOptions && Object.keys(whereOptions)?.length && !attributes)
    throw new Error(`cacheKey attributes not exists`)


  const newWhereOptions = attributes?.reduce((result: object, current: string): object => {
    const currentPropValue = whereOptions[current]

    if (currentPropValue == undefined)
      throw new Error(`${[current]} value is missing`)

    return {
      ...result,
      [current]: whereOptions[current]
    }
  }, {})

  return newWhereOptions as T
}

function setOrder<T extends [string, string][]>(orders: T, orderCache: readonly string[]): T {
  if (orders?.length && !orderCache?.length)
    throw new Error(`order for this cache not set`)

  orderCache?.forEach((order, index) => {
    if (order !== orders[index][0])
      throw new Error(`Order ${order} not set properly`)
  })
  return orders
}

function setGroup<T extends string[]>(groups: T, groupCache: readonly string[]): T {
  if (groups?.length && !groupCache?.length)
    throw new Error(`Group for this cache not set`)

  groupCache?.forEach((group, index) => {
    if (group !== groups[index])
      throw new Error(`Order ${group} not set properly`)
  })
  return groups
}

function setOptions(options: FindOptionsCache<any>, cache: CacheKey) {
  const where: WhereOptions = setWhereOptions(options?.where, cache.attributes)
  const order = setOrder(options?.order, cache.order)
  const having = setWhereOptions(options.having, cache.havingAttributes)
  const group = setGroup(options.group, cache.group)

  return { where, order, group, having }
}

function transformCacheToModel(modelClass: any, dataCache: string) {
  const modelData = JSON.parse(dataCache)

  if (!modelData) return null

  const model = new modelClass(modelData, { isNewRecord: false })

  if (modelData.createdAt)
    model.setDataValue('createdAt', modelData.createdAt)

  if (modelData.updatedAt)
    model.setDataValue('updatedAt', modelData.updatedAt)

  return model
}

function TransformCacheToModels(modelClass: any, dataCache: string) {
  const modelDatas = JSON.parse(dataCache)

  if (!modelDatas?.length) return []

  const models = modelClass.bulkBuild(modelDatas, { isNewRecord: false })

  return models.map((model, index) => {
    const modelData = modelDatas[index]
    if (modelData.createdAt)
      model.setDataValue('createdAt', modelData.createdAt)

    if (modelData.updatedAt)
      model.setDataValue('updatedAt', modelData.updatedAt)

    return model
  })
}

export class BaseModel<M extends readonly CacheKey[] = readonly any[], TAttributes extends {} = any, TCreate extends {} = TAttributes>
  extends Model<TAttributes, TCreate> {

  static caches: CacheKey[] = []
  static modelTTL: number = 0
  static notFoundMessage = `${BaseModel.name} Model Not Found`

  caches: M



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
  static async findOneCache<T extends BaseModel>(this: { new(): T },
    cacheName: T['caches'][number]['name'],
    { isThrow, ttl, ...options }: FindOptionsCache<T['caches'][number]['attributes'][number]> = { isThrow: false },
  ): Promise<T> {

    const TTL = ttl || this['modelTTL'] || RepositoryModule.defaultTTL

    const cache = this['caches'].find(cache => cache.name === cacheName)
    if (!cache)
      throw new Error(`cache name '${cacheName}' not exists at model ${this.name}`)

    const cacheOptions = setOptions(options, cache)

    const optionsString = CacheUtility.setQueryOptions(cacheOptions)
    const cacheKey = CacheUtility.setKey(this.name, optionsString, cacheName)
    let modelString = await RepositoryModule.catchGetter({ key: cacheKey })

    if (!modelString) {

      const newModel = await this['findOne'](cacheOptions)
      modelString = JSON.stringify(newModel)

      if (newModel)
        RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl: TTL })
    }

    const model = transformCacheToModel(this, modelString)

    const modelNullOrDeleted = Boolean(!model || model.isDeleted)
    if (modelNullOrDeleted && isThrow) {
      throw Error(`${this['notFoundMessage']}`)
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
  static async findByPkCache<T extends BaseModel>(this: { new(): T },
    identifier: string | number,
    { isThrow, ttl }: DefaultOptionsCache = { isThrow: false, ttl: 0 },
  ): Promise<T> {

    const TTL = ttl || this['modelTTL'] || RepositoryModule.defaultTTL

    const cacheKey = CacheUtility.setKey(`${this.name}`, identifier, 'id')
    let modelString = await RepositoryModule.catchGetter({ key: cacheKey })

    if (!modelString) {

      const newModel = await this['findByPk'](identifier)
      modelString = JSON.stringify(newModel)

      if (newModel)
        RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl: TTL })
    }

    const model = transformCacheToModel(this, modelString)

    const modelNullOrDeleted = Boolean(!model || model.isDeleted)
    if (modelNullOrDeleted && isThrow) {
      throw Error(`${this['notFoundMessage']}`)
    }

    return model
  }

  static async findAllCache<T extends BaseModel>(this: { new(): T },
    { ttl, ...options }: FindAllOptionsCache<T>,
  ): Promise<T[]> {

    const TTL = ttl || this['modelTTL'] || RepositoryModule.defaultTTL

    // get max updatedAt on model
    const [maxUpdatedAt, count] = await Promise.all([
      this['max']('updatedAt', { where: options.where }),
      this['count'](options),
    ])

    if (!count && !maxUpdatedAt) return TransformCacheToModels(this, '[]')

    const max = DateUtility.convertDateTimeToEpoch(maxUpdatedAt) + +count

    // setting up key for FindOptions
    const keyOpts = CacheUtility.setQueryOptions(options);

    // get what time is cached on this model based on keyOpts
    const keyTime = CacheUtility.setKey(this.name, keyOpts)
    let timeCached = await RepositoryModule.catchGetter({ key: keyTime })

    let canFetch = false
    // set time cache if timeCached is null
    if (!timeCached || max.toString() != timeCached) {
      canFetch = true

      await RepositoryModule.catchSetter({ key: keyTime, value: max.toString(), ttl: TTL })
      timeCached = max.toString()
    }

    // set key for get model
    const keyModel = CacheUtility.setKey(this.name, timeCached, keyOpts)
    // get the model result based on key
    let modelString = await RepositoryModule.catchGetter({ key: keyModel })

    // check if result is null or can fetch
    // then can fetch row on database
    if (canFetch || !modelString) {
      // fetch row on models
      const newModels = await this['findAll'](options)
      modelString = JSON.stringify(newModels)

      // set cache model based on new key
      const newKeyModel = CacheUtility.setKey(this.name, max, keyOpts)
      RepositoryModule.catchSetter({ key: newKeyModel, value: modelString, ttl: TTL })
    }

    return TransformCacheToModels(this, modelString)
  }
}



