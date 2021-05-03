import { WhereOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';

import { CacheKey } from './cache-utilty';

export function base<M extends readonly CacheKey[], TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes>(cacheKeys: M) {
  return class BaseModel extends Model<TModelAttributes, TCreationAttributes> {

    static async findOneCache<T extends Model>(this: { new(): T } & typeof BaseModel,
      keys: M[number]['key'],
      whereOptions: WhereOptions,
      cacheOptions: { ttl?: number, rejectOnEmpty?: boolean } = { ttl: 1000, rejectOnEmpty: false }
    ): Promise<T> {
      return await this.findOne<T>({ where: whereOptions })
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




