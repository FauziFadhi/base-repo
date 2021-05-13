import { circularToJSON } from 'helpers';
import { RepositoryModule } from 'repository.module';
import { addOptions } from 'sequelize-typescript';

import CacheUtility, { CacheKey, CacheKeyAtt } from './cache-utilty';


async function invalidateCache(model, options, { name, caches }: { name: string, caches: CacheKey }) {
  const previousModel = { ...model['dataValues'], ...circularToJSON(model['_previousDataValues']) }

  console.log('previousModel', previousModel);
  if (options?.transaction) {
    options.transaction.afterCommit(() => {
      invalidationCache(previousModel, { name, caches })
    })
    console.log('hooks after update transaction');
    return model
  }
  invalidationCache(previousModel, { name, caches })
  console.log('hooks after update');
  return model

}

function annotate(target, options: { hooks }) {
  addOptions(target.prototype, options)
}

function getWhereOptions(previousModel, attributes: readonly string[]) {

  if (!attributes?.length) return undefined
  return attributes?.reduce((result: object, current: string): object => {
    return {
      ...result,
      [current]: previousModel[current]
    }
  }, {})
}

function getOptions(previousModel, cache: CacheKeyAtt) {
  const where = getWhereOptions(previousModel, cache.attributes)
  const having = getWhereOptions(previousModel, cache.havingAttributes)
  const group = cache.group as string[]
  // const order = cache.order as [string, string][]

  return { where, having, group }
}

async function invalidationCache(previousModel, { name: modelName, caches }: { name: string, caches: CacheKey }) {
  findByPkInvalidation(previousModel, modelName)

  const cacheInvalidate = []
  const invalidation = RepositoryModule.cacheInvalidate;
  for (const keyName in caches) {
    const cache = caches[keyName];
    const cacheOptions = getOptions(previousModel, cache)
    const whereOptionsString = CacheUtility.setQueryOptions(cacheOptions)
    const key = CacheUtility.setKey(modelName, whereOptionsString, keyName)

    cacheInvalidate.push(await invalidation({ key }))
  }
}

async function findByPkInvalidation(previousModel, modelName) {
  const key = CacheUtility.setKey(`${modelName}`, previousModel.id, 'id')
  const invalidation = RepositoryModule.cacheInvalidate;
  return await invalidation({ key })
}


export function Cache(cacheOptions: { ttl?: number, caches: CacheKey }) {
  return (target) => {

    const options: { hooks } = Object.assign({},
      {
        hooks: {
          afterUpdate: async (instance, options) => {
            console.log('instance', instance);
            return await invalidateCache(instance, options, target)
          },
          afterDestroy: async (instance, options) => {
            return await invalidateCache(instance, options, target)
          },
          beforeBulkUpdate: function (options) {
            options.individualHooks = true;
          }
        },
      });


    console.log('cache2');
    console.log('cacheOptions', cacheOptions);
    target['caches'] = cacheOptions.caches || {}
    target[`modelTTL`] = cacheOptions.ttl || 0
    annotate(target, options);
  }

}