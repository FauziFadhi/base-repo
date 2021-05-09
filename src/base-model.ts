import { DateUtility } from 'date-utility';
import { RepositoryModule } from 'repository.module';
import { FindOptions, Identifier, WhereAttributeHash, WhereOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';

import CacheUtility, { CacheKey } from './cache-utilty';

type ExtractRouteParams<T extends PropertyKey> = string extends T
  ? Record<string, string>
  : { [k in T]?: unknown }

interface DefaultOptionsCache {
  ttl?: number
  isThrow?: boolean
}
export interface FindOptionsCache<T extends PropertyKey> extends DefaultOptionsCache {
  where?: WhereAttributeHash<ExtractRouteParams<T>>
  order?: [string, string][]
  having?: WhereAttributeHash<any>
  group?: string[]
}

export interface FindAllOptionsCache<T extends PropertyKey> extends Omit<FindOptions<T>, 'lock' | 'raw'> {
  ttl?: number
}

function setWhereOptions<T>(whereOptions: WhereOptions<T>, attributes: readonly string[]): T {

  const newWhereOptions = attributes.reduce((result: object, current: string): object => {
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
  orderCache.forEach((order, index) => {
    if (order !== orders[index][0])
      throw new Error(`Order ${order} not set properly`)
  })
  return orders
}

function setGroup<T extends string[]>(groups: T, groupCache: readonly string[]): T {
  groupCache.forEach((group, index) => {
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

  console.log('modelClass', modelClass);

  const model = new modelClass(modelData, { isNewRecord: false })

  if (modelData.createdAt)
    model.setDataValue('createdAt', modelData.createdAt)

  if (modelData.updatedAt)
    model.setDataValue('updatedAt', modelData.updatedAt)

  return model
}

export function base<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes, M extends readonly CacheKey[] = []>(caches: M) {
  return class BaseModel extends Model<TModelAttributes, TCreationAttributes> {

    static caches = caches
    static modelTTL = 0
    static notFoundMessage = 'Model Not Found'

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
    static async findOneCache<T extends Model>(this: { new(): T } & typeof BaseModel,
      cacheName: M[number]['name'],
      { isThrow, ttl, ...options }: FindOptionsCache<M[number]['attributes'][number]> = { isThrow: false },
    ): Promise<T> {

      console.log('modelTTL', this.modelTTL);
      const TTL = ttl || this.modelTTL || RepositoryModule.defaultTTL

      const cache = caches.find(cache => cache.name === cacheName)
      if (!cache)
        throw new Error(`cache name '${cacheName}' not exists at model ${this.name}`)

      const cacheOptions = setOptions(options, cache)

      const optionsString = CacheUtility.setQueryOptions(cacheOptions)
      const cacheKey = CacheUtility.setKey(this.name, optionsString, cacheName)
      let modelString = await RepositoryModule.catchGetter({ key: cacheKey })

      if (!modelString) {

        const newModel = await this.findOne<T>(cacheOptions)
        modelString = JSON.stringify(newModel)

        if (newModel)
          RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl: TTL })
      }

      const model = transformCacheToModel(this, modelString)

      const modelNullOrDeleted = Boolean(!model || model.isDeleted)
      if (modelNullOrDeleted && isThrow) {
        throw Error(`${this.notFoundMessage}`)
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
    static async findByPkCache<T extends Model>(this: { new(): T } & typeof BaseModel,
      identifier: Identifier,
      { isThrow, ttl }: DefaultOptionsCache,
    ): Promise<T> {

      const TTL = ttl || this.modelTTL || RepositoryModule.defaultTTL

      const cacheKey = CacheUtility.setKey(`${this.name}`, identifier, 'id')
      let modelString = await RepositoryModule.catchGetter({ key: cacheKey })

      if (!modelString) {

        const newModel = await this.findByPk<T>(identifier)
        modelString = JSON.stringify(newModel)

        if (newModel)
          RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl: TTL })
      }

      const model = transformCacheToModel(this, modelString)

      const modelNullOrDeleted = Boolean(!model || model.isDeleted)
      if (modelNullOrDeleted && isThrow) {
        throw Error(`${this.notFoundMessage}`)
      }

      return model
    }

    static async findAllCache<T extends Model>(this: { new(): T } & typeof BaseModel,
      { ttl, ...options }: FindAllOptionsCache<M[number]['attributes'][number]>,
    ): Promise<T> {

      const TTL = ttl || this.modelTTL || RepositoryModule.defaultTTL

      // get max updatedAt on model
      const [maxUpdatedAt, count] = await Promise.all([
        this.max<any, T>('updatedAt', { where: options.where }),
        this.count<T>(options),
      ])

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
        const newModels = await this.findAll<T>(options)
        modelString = JSON.stringify(newModels)

        // set cache model based on new key
        const newKeyModel = CacheUtility.setKey(this.name, max, keyOpts)
        RepositoryModule.catchSetter({ key: newKeyModel, value: modelString, ttl: TTL })
      }

      return CacheUtility.setResult(modelString)
    }
  }
}



