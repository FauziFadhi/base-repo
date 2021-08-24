import { NotFoundException } from '@nestjs/common';
import { DateUtility } from 'date-utility';
import { RepositoryModule } from 'repository.module';
import { FindOptions, QueryOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';

import CacheUtility, { CacheKey } from './cache-utilty';

type UnusedOptionsAttribute = 'lock' | 'raw' | 'skipLocked' | keyof QueryOptions
export interface DefaultOptionsCache {
  ttl?: number
  /**
     * Throw if nothing was found.
   */
  rejectOnEmpty?: boolean | Error
}
export interface FindAllNestedOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute>, DefaultOptionsCache {
  ttl: number
}

export interface FindAllOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute | 'include'>, DefaultOptionsCache {

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
  const modelData = JSON.parse(dataCache)

  if (!modelData?.length) return []

  const models = modelClass.bulkBuild(modelData, { isNewRecord: false })

  return models.map((model, index) => {
    const data = modelData[index]
    if (data.createdAt)
      model.setDataValue('createdAt', data.createdAt)

    if (data.updatedAt)
      model.setDataValue('updatedAt', data.updatedAt)

    return model
  })
}

export class BaseModel<TAttributes extends {} = any, TCreate extends {} = TAttributes>
  extends Model<TAttributes, TCreate> {

  static caches: CacheKey = {}
  static modelTTL = 0
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
  static async findOneCache<T extends BaseModel>(this: { new(): T },
    { ttl, ...options }: FindAllNestedOptionsCache<T['_attributes']> | FindAllOptionsCache<T['_attributes']>,
  ): Promise<T> {

    const TTL = ttl || this['modelTTL'] || RepositoryModule.defaultTTL

    const rejectOnEmpty = options?.rejectOnEmpty
    delete options?.rejectOnEmpty

    const optionsString = CacheUtility.setOneQueryOptions(options)
    const keys = await RepositoryModule.catchKeyGetter({ keyPattern: `*${this.name}*_${optionsString}*` })
    const firstKey = keys?.[0]
    const key = firstKey?.substring(firstKey.indexOf(":"))

    let modelString = await RepositoryModule.catchGetter({ key: key })

    if (!modelString) {
      const newModel = await this['findOne'](options)
      modelString = JSON.stringify(newModel)


      if (newModel) {
        const key = CacheUtility.setKey(this.name, optionsString, newModel[this['primaryKeyAttribute']])
        RepositoryModule.catchSetter({ key, value: modelString, ttl: TTL })
      }
    }

    const model = transformCacheToModel(this, modelString)

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
  static async findByPkCache<T extends BaseModel>(this: { new(): T },
    identifier: string | number,
    options?:
      Omit<FindAllNestedOptionsCache<T['_attributes']>, 'where'>
      | Omit<FindAllOptionsCache<T['_attributes']>, 'where'>,
  ): Promise<T> {

    const TTL = options?.ttl || this['modelTTL'] || RepositoryModule.defaultTTL
    delete options?.ttl
    const rejectOnEmpty = options?.rejectOnEmpty
    delete options?.rejectOnEmpty

    const optionsString = CacheUtility
      .setOneQueryOptions({ ...options, where: { [this['primaryKeyAttribute']]: identifier } }) + 'pk'
    const key = CacheUtility.setKey(this.name, optionsString, `${identifier}`)

    let modelString = await RepositoryModule.catchGetter({ key })
    if (!modelString) {

      const newModel = await this['findByPk'](identifier, options)
      modelString = JSON.stringify(newModel)

      if (newModel) {
        RepositoryModule.catchSetter({ key, value: modelString, ttl: TTL })
      }
    }

    const model = transformCacheToModel(this, modelString)

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

  static async findAllCache<T extends BaseModel>(this: { new(): T },
    { ttl, ...options }: FindAllOptionsCache<T>,
  ): Promise<T[]> {

    const TTL = ttl || this['modelTTL'] || RepositoryModule.defaultTTL

    // get max updatedAt on model
    const [maxUpdatedAt, count] = await Promise.all([
      this['max']('updatedAt', options),
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



