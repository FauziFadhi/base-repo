import { RepositoryModule } from 'repository.module';
import { FindOptions, WhereOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';

import CacheUtility, { CacheKey } from './cache-utilty';

type ExtractRouteParams<T extends PropertyKey> = string extends T
  ? Record<string, string>
  : { [k in T]?: unknown }

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

function getAttributesKey(key: string, cacheKeys: readonly CacheKey[]): readonly string[] {
  const cacheKey = cacheKeys.find(cache => cache.name === key)

  if (!cacheKey || !cacheKey.attributes)
    throw new Error(`cacheKey ${key} not exists`)

  return cacheKey.attributes
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

    static async findOneCache<T extends Model>(this: { new(): T } & typeof BaseModel,
      cacheName: M[number]['name'],
      options: FindOptions<ExtractRouteParams<M[number]['attributes'][number]>> & { ttl?: number, rejectOnEmpty?: boolean | Error },
    ): Promise<T> {

      console.log('modelTTL', this.modelTTL);
      const ttl = options.ttl || this.modelTTL || RepositoryModule.defaultTTL

      if (!caches.some(cache => cache.name === cacheName))
        throw new Error(`cache name '${cacheName}' not exists at model ${this.name}`)


      const attributesKey = getAttributesKey(cacheName, this.caches)
      const whereOptions = setWhereOptions(options?.where, attributesKey)

      const whereOptionsString = CacheUtility.setQueryOptions({ where: whereOptions })
      const cacheKey = CacheUtility.setKey(this.name, whereOptionsString, cacheName)
      let modelString = await RepositoryModule.catchGetter({ key: cacheKey })

      if (!modelString) {

        const newModel = await this.findOne<T>({ ...options, where: whereOptions })
        modelString = JSON.stringify(newModel)

        if (newModel)
          RepositoryModule.catchSetter({ key: cacheKey, value: modelString, ttl })
      }

      const model = transformCacheToModel(this, modelString)

      if (!model && options.rejectOnEmpty) {
        throw Error(`${this.notFoundMessage}`)
      }

      return model
    }
  }
}












// const repo = <Set,Get>(callbackSet: (key: string, ttl: number) => Set, callbackGet: (key: string) => Get) => {

//   return {set: callbackSet, get: callbackGet}
// }

// const setCache = (key: string) => {
//   return key+'a'
// }
// const getCache = (key: string) => {
//   return key
// }

// const {set, get} = repo( (key, ttl) => {
//   return setCache(key)
// }, (key) => {
// return getCache(key)
// })


// console.log(set('key', 1));



// console.log(set('4',1));


// const a = {
//   b: {
//     a: 'asd',
//     c: 'asd',
//   }
// }

// // interface CacheKey {
// //   [k: string]: string[]
// // }
// // const MyArray1: CacheKey = {
// //   'asd': ['asd', 'asd']
// // }

// const MyArray = [
//   { name: "Alice", age: 15 },
//   { name: "Bob", age: 23 },
//   { name: "Eve", age: 38 },
// ] as const;

// type Person = typeof MyArray[number]['name'];
// // type Person1 = keyof typeof MyArray1;

// interface CacheKey {
//   key: string
//   attributes: string[]
// }

// interface ICache {
//   ttl?: number
//   cacheKey?: CacheKey[]
// }

// const lala = {
// ttl: 10,
// cacheKey: [
//   {key: 'id', attributes: ['asd', 'gsd']},
//   {key: 'qwe', attributes: ['dfgs', 'dfg']}
// ] 
// } as const

// const validateKey = lala.cacheKey


// const bangke = lala.cacheKey
// type keyCache = typeof bangke[number]['key'];

// const model = {
//   asd: 'asd',
//   gsd: 'bxcv',
//   dfgs: 'xxcv',
//   dfg: 'xcvxcv'
// }

// const listOfKeys = validateKey.map(({attributes}) => {

//   let a = {}

//   attributes.forEach(att => {
//     a = {
//       ...a,
//       [att]: model[att],
//     }
//   });

//   return a
// })
// console.log(listOfKeys);




