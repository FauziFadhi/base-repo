import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import CacheUtility from 'cache-utilty';
import { DateUtility } from 'date-utility';
import { circularToJSON, textToSnakeCase } from 'helpers';
import { pickBy } from 'lodash';
import { AfterDestroy, AfterUpdate, Model, Sequelize } from 'sequelize-typescript';
import { BuildOptions, FindAndCountOptions, FindOptions } from 'sequelize/types';

import { GetOptions, getOptionsCache, ListGetOptionsCache } from './base-repository';

type Constructor<T> = { new(): T }

export class BaseModel<T> extends Model<T, BaseModel<T>> {
  static cacheStore
  static db = Sequelize
  static cacheModel = BaseModel.name

  protected static invalidateCache<T extends Model>(model: T) {

  }

  protected static setRedisClient() {

  }


  @AfterUpdate
  @AfterDestroy
  static invalidateModelCache(model, options) {
    const previousModel = { ...circularToJSON(model), ...circularToJSON(model._previousDataValues) }
    console.log(previousModel, 'invalidatedModel');
    if (options.transaction) {
      options.transaction.afterCommit(() => {
        this.invalidateAllCache(previousModel)
        console.log('invalidate update transaction');
      })
      return model;
    }
    console.log('invalidate update');
    this.invalidateAllCache(previousModel)
  }

  protected static setKeyOneAttribute(attributeName: string, attributeValue: any): string {
    if (!this.db) throw new InternalServerErrorException('base DB Config at service is null')
    if (attributeName == 'id')
      return CacheUtility.setKey(`${this.cacheModel}`, attributeValue)
    return CacheUtility.setKey(`${this.cacheModel}_${attributeName}`, attributeValue)
  }

  protected static setKeyMultiAttribute(key: any) {
    const keyOpts = CacheUtility.setQueryOptions(key)
    return CacheUtility.setKey(this.getCacheModel(), keyOpts)
  }

  protected static setInvalidateCache(key: any) {
    console.log('key', key);
    CacheUtility.invalidate(key, this.getCacheStore())
  }

  private static getNewModelClass<M extends Model<M>>(this: { new(): M } & typeof BaseModel, values: object, options: BuildOptions) {
    return new this(values, options)
  }

  protected static defaultThrow<M extends Model<M>>(this: { new(): M } & typeof BaseModel) {
    throw new BadRequestException(`${new this().constructor.name} data not Found`)
  }

  protected static setCacheStore(cacheStore: any) {
    this.cacheStore = cacheStore
  }

  protected static getCacheStore() {
    this.setRedisClient()
    if (!this.cacheStore) throw new InternalServerErrorException('base cache Store at service is null')
    return this.cacheStore
  }

  protected static getDbConfig() {
    if (!this.db) throw new InternalServerErrorException('base DB Config at service is null')
    return this.db
  }

  protected static getCacheModel(): string {
    if (!this.cacheModel) throw new InternalServerErrorException('base cache model at service is null')
    return this.cacheModel
  }

  private static throwNullOrDeleted(dataModel: any, isThrow: boolean) {
    if ((!dataModel || dataModel?.isDeleted) && isThrow)
      this.defaultThrow()
  }


  private static getAllFindByCacheName(): string[] {
    const allFunction = Object.getOwnPropertyNames(this)
    return allFunction.filter(func => func.startsWith('findBy') && func.endsWith('Cache'))
  }

  /**
   * invalidate all Cache findBy...Cache One Attribute Cache except Id
   * @param model modelClass
   * @param allFindByCacheName all function name with prefix `findBy` and postfix `Cache`
   */
  private static async invalidateAllFindByCache<T extends Model>(modelClass: T) {
    const allFindByCacheName = this.getAllFindByCacheName()
    console.log(allFindByCacheName);

    for await (const func of allFindByCacheName) {

      const findByTextLength = 6
      const cacheTextLength = 5

      // get attribute name, example `findByTypeCache` return `Type`
      const attributeName = func.slice(findByTextLength, -cacheTextLength)
      console.log('attributeName', attributeName);

      // make first char to lower case
      const toCamelCase = attributeName.charAt(0).toLowerCase() + attributeName.slice(1);

      // invalidate all cache from findBy`attribute`Cache
      const key = this.setKeyOneAttribute(toCamelCase, modelClass[`${toCamelCase}`])
      CacheUtility.invalidate(key, this.getCacheStore())
    }
  }

  /**
   * invalidate semua cache mau custom, atau pun yang fungsi ada Prefix dan PostFix FindBy...Cache dari model yang active
   * @param modelClass model class
   */
  private static async invalidateAllCache<T extends Model>(modelClass: T) {
    this.invalidateAllFindByCache(modelClass)
    this.invalidateCache(modelClass)

    // invalidate cache by Id, karena bentuk keynya beda sendiri
    const key = CacheUtility.setKey(this.getCacheModel(), modelClass.id)
    CacheUtility.invalidate(key, this.getCacheStore())
  }

  static async paginate<M extends Model<M>>(this: { new(): M } & typeof BaseModel, options: FindAndCountOptions & { includeDeleted?: boolean }) {
    options.includeDeleted = options.includeDeleted || false

    options.where = {
      ...pickBy({ isDeleted: this.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined }),
      ...options.where
    }

    return await this.findAndCountAll<M>({ ...options, order: options?.order || [[this.primaryKeyAttribute, 'asc']] })
  }

  static async list<M extends Model<M>>(this: { new(): M } & typeof BaseModel, options: FindOptions & { includeDeleted?: boolean }): Promise<M[]> {
    options.includeDeleted = options.includeDeleted || false
    options.where = {
      ...pickBy({ isDeleted: this.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined }),
      ...options.where
    }

    return await this.findAll<M>({ ...options, order: options?.order || [[this.primaryKeyAttribute, 'asc']] })
  }


  /**
   *
   * @param options `query` query select
   * @param includeDeleted @default false `boolean' if `true` return model even attribute isDeleted true
   */
  static async listCache<M extends Model<M>>(this: { new(): M } & typeof BaseModel, option: FindOptions & ListGetOptionsCache = {}): Promise<M[]> {
    const { ttl, includeDeleted, ...options } = { ... new ListGetOptionsCache(), ...option }

    // get max updatedAt on model
    const [maxUpdatedAt, count] = await Promise.all([
      this.max('updatedAt', { where: options.where }),
      this.count({ where: options.where }),
    ])

    const max = DateUtility.convertDatetimeToEpoch(maxUpdatedAt) + +count

    // setting up key for FindOptions
    const keyOpts = CacheUtility.setQueryOptions(options);

    // get what time is cached on this model based on keyOpts
    const keyTime = CacheUtility.setKey(this.cacheModel, keyOpts)
    let timeCached = await this.getCacheStore().get(keyTime)

    // set time cache if timeCached is null
    if (!timeCached) {
      await this.getCacheStore().set(keyTime, max, 'EX', ttl)
      timeCached = max
    }
    // set key for get model
    const key = CacheUtility.setKey(this.cacheModel, timeCached, keyOpts)

    // flag for fetching data from database
    let canFetch = false;
    // if max updated model > time cache then invalidate cache
    if (max != timeCached) {
      canFetch = await CacheUtility.invalidate(key, this.getCacheStore())
      this.getCacheStore().set(keyTime, max, 'EX', ttl)
    }

    // get the model result based on key
    let result = await this.getCacheStore().get(key)

    // check if result is null or can fetch
    // then can fetch row on database
    if (canFetch || !result) {
      // fetch row on models
      const model = await this.list<M>({ ...options, includeDeleted: true })
      result = JSON.stringify(model)

      // set cache model based on new key
      const newKey = CacheUtility.setKey(this.cacheModel, max, keyOpts)
      await this.getCacheStore().set(newKey, result, 'EX', ttl)
    }

    if (!includeDeleted) { // `false` filter yang deleted false aja
      return CacheUtility.setResult(result).filter(res => !res.isDeleted)
    }

    return CacheUtility.setResult(result)
  }

  private static getDataOrThrow(dataModel: any, { isThrow, includeDeleted }: GetOptions) {

    // if Object data softDeleted, and throw it when want to throw, if not return data althought softDeleted
    this.throwNullOrDeleted(dataModel, isThrow)

    // if include deleted false, and isDeleted data is true then return null.
    if (!includeDeleted && dataModel?.isDeleted)
      return null

    return dataModel
  }

  private static getDataOrThrowFromCache(resultCache: any, getOptions: GetOptions) {
    // parse data dan bikin object model baru biar bisa di chaining di fungsi sequelize
    const model = this.getDataModelFromCache(resultCache)

    return this.getDataOrThrow(model, getOptions)
  }

  private static createInstance<T extends Model>(model: Constructor<T> & typeof Model) {
    return model
  }

  /**
   *
   * @param options query options
   * @param isThrow `boolean` if true and result null throw exception
   */
  static async getOne<T extends Model>(this: Constructor<T> & typeof BaseModel, options: FindOptions & GetOptions): Promise<T> {
    const { includeDeleted, isThrow, ...option } = { ...new GetOptions(), ...options }
    const model = await this.findOne<T>(option)
    console.log('baseModel', model);

    return BaseModel.getDataOrThrow(model, { includeDeleted, isThrow })
  }

  /**
   * @param id id dari data dalam database untuk select data
   * @param isThrow @default false if `true` throw exception when data null from db
   * @return Model
   */
  static async findById<T extends Model>(this: Constructor<T> & typeof BaseModel, id: number, getOptions: GetOptions = {}): Promise<T> {
    return await this.getOne<T>({ ...new GetOptions(), ...getOptions, where: { id } })
  }

  /**
   * hasil bisa di chaining dengan fungsi sequelize
   * @param id id of Model
   * @param isThrow @default false if `true` throw exception when data null from db
   */
  static async findByIdCache<M extends Model>(this: { new(): M } & typeof BaseModel, id: number, getOptions: getOptionsCache = {}): Promise<M> {
    return await this.findByOneAttributeCache<M>({ name: 'id', value: id }, { ...new getOptionsCache(), ...getOptions })
  }

  /**
   * hasil bisa di chaining dengan fungsi sequelize
   * @param attribute main `attribute`
   * @param isThrow @default false if `true` throw exception when data null from db
   */
  protected static async findByOneAttributeCache<M extends Model>(this: { new(): M } & typeof BaseModel, { name, value }, getOptionsCaches: FindOptions & getOptionsCache = {}): Promise<M> {
    const { ttl, includeDeleted, isThrow, ...options } = { ...new getOptionsCache(), ...getOptionsCaches }
    const key = this.setKeyOneAttribute(name, value);

    console.log('baseModel', key);
    let result = await this.getCacheStore().get(key)
    if (!result) {
      const snakeCaseName = textToSnakeCase(name)
      // biar cache ambil yang deleted, biar cachenya satu aja. tinggal filter pake logic
      let model = null
      if (typeof value === 'string')
        model = await this.getOne({
          ...options,
          where: this.getDbConfig().literal(`${snakeCaseName} = '${value}'`),
          includeDeleted: true,
        })
      else
        model = await this.getOne({
          ...options,
          where: this.getDbConfig().literal(`${snakeCaseName} = ${value}`),
          includeDeleted: true,
        })

      if (model) await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl)

      result = JSON.stringify(model)
    }

    return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow })
  }

  protected static async findByMultiAttributeCache<M extends Model<M>>(this: { new(): M } & typeof BaseModel, key: string, getOptionsCaches: FindOptions & getOptionsCache): Promise<M> {
    const { ttl, includeDeleted, isThrow, ...options } = { ...new getOptionsCache(), ...getOptionsCaches }

    let result = await this.getCacheStore().get(key)

    if (!result) {
      // biar cache ambil yang deleted, biar cachenya satu aja. tinggal filter pake logic
      const model = await this.getOne({ ...options, includeDeleted: true })

      if (model) await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl)

      result = JSON.stringify(model)
    }
    return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow })
  }

  /**
   * parse from string to standard object and make new model object from standard object. that can use sequelize function
   */
  private static getDataModelFromCache(dataCache: string) {
    const model = JSON.parse(dataCache)

    // jika dataModel null (bentuk string) setelah di parse di line atas dari cache, maka set null
    if (!model) return null
    const newModelClass = this.getNewModelClass(model, { isNewRecord: false })

    if (model.createdAt && model.updatedAt) {
      newModelClass.setDataValue('createdAt', model.createdAt)
      newModelClass.setDataValue('updatedAt', model.updatedAt)
    }

    return newModelClass
  }

  // /**
  //  * fungsi data update model `isDeleted` `true` yang mana data model harus di isi dari `find` atau `create` dan otomatis menghapus cache lama
  //  * @param transaction `optional` if need database transaction
  //  */
  // protected async softDelete(dataModel: any, transaction?: Transaction): Promise<T> {
  //   if (!dataModel)
  //     throw new InternalServerErrorException('data model null, nothing to update')

  //   return await dataModel.update({ isDeleted: true }, transaction)
  // }
}
