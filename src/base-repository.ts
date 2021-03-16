import { HttpException } from '@nestjs/common';
import CacheUtility from 'cache-utilty';
import { DateUtility } from 'date-utility';
import { circularToJSON, textToSnakeCase } from 'helpers';
import { isEmpty, isUndefined, omitBy } from 'lodash';
import { RepositoryModule } from 'repository.module';
import { Model, Sequelize } from 'sequelize-typescript';
import {
  BuildOptions,
  BulkCreateOptions,
  CountOptions,
  FindAndCountOptions,
  FindOptions,
  FindOrCreateOptions,
  Transaction,
  UpdateOptions,
} from 'sequelize/types';

export class GetOptions {
  isThrow?: boolean = false
  includeDeleted?: boolean = false
}

export class getOptionsCache extends GetOptions {
  ttl?: number = RepositoryModule.defaultTTL
}

export class ListGetOptionsCache {
  ttl?: number = RepositoryModule.defaultTTL
  includeDeleted?: boolean = false
}

export abstract class Repository<T extends Model<T>> {
  private cacheModel = null
  private model: any
  private cacheStore = null;
  private db = null;
  constructor(model: any, cacheModel: string) {
    this.model = model
    this.cacheModel = cacheModel


    this.setDbConfig(RepositoryModule.sequelize)

    // set hook everytime get data from service, when ever update from service or not automatically invalidate all cache
    this.model.afterUpdate((model, options) => {
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
    })
    this.model.afterDestroy((model, options) => {
      const previousModel = { ...circularToJSON(model), ...circularToJSON(model._previousDataValues) }
      console.log(previousModel, 'invalidatedModel');
      if (options.transaction) {
        options.transaction.afterCommit(() => {
          this.invalidateAllCache(previousModel)
          console.log('invalidate destroy transaction');
        })
        return model;
      }
      console.log('invalidate destroy');
      this.invalidateAllCache(previousModel)
    })
  }

  protected abstract invalidateCache(model: T)

  protected setKeyMultiAttribute(key: any) {
    const keyOpts = CacheUtility.setQueryOptions(key)
    return CacheUtility.setKey(this.getCacheModel(), keyOpts)
  }

  protected setInvalidateCache(key: any) {
    console.log('key', key);
    CacheUtility.invalidate(key, this.getCacheStore())
  }

  private getNewModelClass(values: object, options: BuildOptions) {
    return new this.model(values, options)
  }

  protected defaultThrow() {
    throw new HttpException(`${new this.model().constructor.name} data not Found`, 404)
  }

  protected setCacheStore(cacheStore: any) {
    this.cacheStore = cacheStore
  }

  protected getCacheStore() {
    if (!this.cacheStore) throw new HttpException('base cache Store at service is null', 500)
    return this.cacheStore
  }

  protected getDbConfig() {
    if (!this.db) throw new HttpException('base DB Config at service is null', 500)
    return this.db
  }

  private setDbConfig(db: Sequelize) {
    this.db = db
  }

  protected getCacheModel(): string {
    if (!this.cacheModel) throw new HttpException('base cache model at service is null', 500)
    return this.cacheModel
  }

  private throwNullOrDeleted(dataModel: any, isThrow: boolean) {
    if ((!dataModel || dataModel?.isDeleted) && isThrow)
      this.defaultThrow()
  }

  protected setKeyOneAttribute(attributeName: string, attributeValue: any): string {
    if (!this.db) throw new HttpException('base DB Config at service is null', 500)
    if (attributeName == 'id')
      return CacheUtility.setKey(`${this.cacheModel}`, attributeValue)
    return CacheUtility.setKey(`${this.cacheModel}_${attributeName}`, attributeValue)
  }

  private getAllFindByCacheName(): string[] {
    const allFunction = Object.getOwnPropertyNames(this)
    return allFunction.filter(func => func.startsWith('findBy') && func.endsWith('Cache'))
  }

  /**
   * invalidate all Cache findBy...Cache One Attribute Cache except Id
   * @param model modelClass
   * @param allFindByCacheName all function name with prefix `findBy` and postfix `Cache`
   */
  private async invalidateAllFindByCache(modelClass: T) {
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
  private async invalidateAllCache(modelClass: T) {
    this.invalidateAllFindByCache(modelClass)
    this.invalidateCache(modelClass)

    // invalidate cache by Id, karena bentuk keynya beda sendiri
    const key = CacheUtility.setKey(this.getCacheModel(), modelClass.id)
    CacheUtility.invalidate(key, this.getCacheStore())
  }

  async paginate(options: FindAndCountOptions & { includeDeleted?: boolean }): Promise<{ rows: T[]; count: number }> {
    options.includeDeleted = options.includeDeleted || false
    options.where = omitBy({
      isDeleted: this.model.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined,
      ...options.where,
    }, isUndefined)

    return await this.model.findAndCountAll({ ...options, order: !isEmpty(options?.order) && options?.order || [[this.model?.primaryKeyAttribute, 'asc']] })
  }

  async list(options: FindOptions & { includeDeleted?: boolean }): Promise<T[]> {
    options.includeDeleted = options.includeDeleted || false
    options.where = omitBy({
      isDeleted: this.model.rawAttributes.isDeleted && !options.includeDeleted ? false : undefined,
      ...options.where,
    }, isUndefined)

    return await this.model.findAll({ ...options, order: !isEmpty(options?.order) && options?.order || [[this.model?.primaryKeyAttribute, 'asc']] })
  }

  /**
   *
   * @param options `query` query select
   * @param includeDeleted @default false `boolean' if `true` return model even attribute isDeleted true
   */
  async listCache(option: FindOptions & ListGetOptionsCache = {}): Promise<T[]> {
    const { ttl, includeDeleted, ...options } = { ... new ListGetOptionsCache(), ...option }

    // get max updatedAt on model
    const [maxUpdatedAt, count] = await Promise.all([
      this.model.max('updatedAt', { where: options.where }),
      this.model.count({ where: options.where }),
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
      const model = await this.list({ ...options, includeDeleted: true })
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

  private getDataOrThrow(dataModel: any, { isThrow, includeDeleted }: GetOptions) {

    // if Object data softDeleted, and throw it when want to throw, if not return data althought softDeleted
    this.throwNullOrDeleted(dataModel, isThrow)

    // if include deleted false, and isDeleted data is true then return null.
    if (!includeDeleted && dataModel?.isDeleted)
      return null

    return dataModel
  }

  private getDataOrThrowFromCache(resultCache: any, getOptions: GetOptions) {
    // parse data dan bikin object model baru biar bisa di chaining di fungsi sequelize
    const model = this.getDataModelFromCache(resultCache)

    return this.getDataOrThrow(model, getOptions)
  }

  /**
   *
   * @param options query options
   * @param isThrow `boolean` if true and result null throw exception
   */
  async findOne(options: FindOptions & GetOptions): Promise<T> {
    const { includeDeleted, isThrow, ...option } = { ...new GetOptions(), ...options }
    const model = await this.model.findOne(option)

    return this.getDataOrThrow(model, { includeDeleted, isThrow })
  }

  /**
   * @param id id dari data dalam database untuk select data
   * @param isThrow @default false if `true` throw exception when data null from db
   * @return Model
   */
  async findById(id: number, getOptions: GetOptions = {}): Promise<T> {
    return await this.findOne({ ...new GetOptions(), ...getOptions, where: { id } })
  }

  /**
   * hasil bisa di chaining dengan fungsi sequelize
   * @param id id of Model
   * @param isThrow @default false if `true` throw exception when data null from db
   */
  findByIdCache = async (id: number, getOptions: getOptionsCache = {}): Promise<T> => {
    return await this.findByOneAttributeCache({ name: 'id', value: id }, { ...new getOptionsCache(), ...getOptions })
  }

  /**
   * hasil bisa di chaining dengan fungsi sequelize
   * @param attribute main `attribute`
   * @param isThrow @default false if `true` throw exception when data null from db
   */
  protected async findByOneAttributeCache({ name, value }, getOptionsCaches: FindOptions & getOptionsCache = {}): Promise<T> {
    const { ttl, includeDeleted, isThrow, ...options } = { ...new getOptionsCache(), ...getOptionsCaches }
    const key = this.setKeyOneAttribute(name, value);

    let result = await this.getCacheStore().get(key)
    if (!result) {
      const snakeCaseName = textToSnakeCase(name)
      // biar cache ambil yang deleted, biar cachenya satu aja. tinggal filter pake logic
      let model = null
      if (typeof value === 'string')
        model = await this.findOne({
          ...options,
          where: this.getDbConfig().literal(`${snakeCaseName} = '${value}'`),
          includeDeleted: true,
        })
      else
        model = await this.findOne({
          ...options,
          where: this.getDbConfig().literal(`${snakeCaseName} = ${value}`),
          includeDeleted: true,
        })

      if (model) await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl)

      result = JSON.stringify(model)
    }

    return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow })
  }

  protected async findByMultiAttributeCache(key: string, getOptionsCaches: FindOptions & getOptionsCache): Promise<T> {
    const { ttl, includeDeleted, isThrow, ...options } = { ...new getOptionsCache(), ...getOptionsCaches }

    let result = await this.getCacheStore().get(key)

    if (!result) {
      // biar cache ambil yang deleted, biar cachenya satu aja. tinggal filter pake logic
      const model = await this.findOne({ ...options, includeDeleted: true })

      if (model) await this.getCacheStore().set(key, JSON.stringify(model), 'EX', ttl)

      result = JSON.stringify(model)
    }
    return this.getDataOrThrowFromCache(result, { includeDeleted, isThrow })
  }

  /**
   * parse from string to standard object and make new model object from standard object. that can use sequelize function
   */
  private getDataModelFromCache(dataCache: string) {
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

  /**
   * fungsi data update model `isDeleted` `true` yang mana data model harus di isi dari `find` atau `create` dan otomatis menghapus cache lama
   * @param transaction `optional` if need database transaction
   */
  protected async softDelete(dataModel: any, transaction?: Transaction): Promise<T> {
    if (!dataModel)
      throw new HttpException('data model null, nothing to update', 500)

    return await dataModel.update({ isDeleted: true }, transaction)
  }

  async createModel(values: object, transaction?: Transaction): Promise<T> {
    return await this.model.create(values, { transaction })
  }

  async bulkUpdate(values: object, options: UpdateOptions, transaction?: Transaction): Promise<[number, T[]]> {
    return await this.model.update(values, { ...options, transaction: options?.transaction || transaction, individualHooks: true })
  }

  async bulkCreate(values: object[], options?: BulkCreateOptions, transaction?: Transaction): Promise<T[]> {
    return await this.model.bulkCreate(values, { ...options, transaction: options?.transaction || transaction })
  }

  async findOrCreate(options: FindOrCreateOptions, transaction: Transaction): Promise<[T, boolean]> {
    return await this.model.findOrCreate({ ...options, transaction: options?.transaction || transaction })
  }

  async findOrBuild(options: FindOrCreateOptions, transaction?: Transaction): Promise<[T, boolean]> {
    return await this.model.findOrBuild({ ...options, transaction: options?.transaction || transaction })
  }

  async count(options: CountOptions): Promise<number> {
    return await this.model.count(options)
  }
}
