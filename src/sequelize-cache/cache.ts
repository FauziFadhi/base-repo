import { circularToJSON } from 'helpers';
import { SequelizeCache } from './sequelize-cache';
import { addOptions, AfterBulkUpdate } from 'sequelize-typescript';


async function invalidateCache(model, options, modelClass) {
  if (SequelizeCache.showLog) {
    const previousModel = { ...model['dataValues'], ...circularToJSON(model['_previousDataValues']) }
    SequelizeCache.logging(previousModel)
  }

  if (options?.transaction) {
    options.transaction.afterCommit(() => {
      invalidationCache({
        [modelClass['primaryKeyAttribute']]: model['_previousDataValues']?.[modelClass['primaryKeyAttribute']],
      }, modelClass)
    })
    SequelizeCache.logging('hooks after update transaction')
    return model
  }
  invalidationCache({
    [modelClass['primaryKeyAttribute']]: model['_previousDataValues']?.[modelClass['primaryKeyAttribute']],
  }, modelClass)
  SequelizeCache.logging('hooks after update')
  return model

}

function annotate(target, options: { hooks }) {
  addOptions(target.prototype, options)
}
async function invalidationCache(previousModel, modelClass) {
  const keys: string[] = await SequelizeCache.catchKeyGetter({ keyPattern: `*:${modelClass.name}_*:${previousModel[modelClass['primaryKeyAttribute']]}` })
  const invalidation = SequelizeCache.cacheInvalidate;
  await Promise.all(keys?.map(async (key) => {
    const usedKey = key?.substring(key?.indexOf(":"))
    if(usedKey)
      return await invalidation({ key: usedKey })
  }))
}

export function Cache(cacheOptions?: { ttl?: number }) {
  return (target) => {
    const options: { hooks } = Object.assign({},
      {
        hooks: {
          afterUpdate: async (instance, options) => {
            invalidateCache(instance, options, target)
            return instance
          },
          afterDestroy: async (instance, options) => {
            invalidateCache(instance, options, target)
            return instance
          },
          beforeBulkUpdate: async (options) => {
            if (options.where?.id?.length || (options?.where?.id && typeof options?.where?.id !== 'object')) {
              return;
            }
            const { transaction, ...customOptions } = options || { transaction: undefined }
            target?.['findAll']?.(customOptions).then(async (models: any[]) => {
              await Promise.all((models || []).map(async(model) => {
                if(model) {
                  invalidateCache(model, options, target)
                }
              }))
            });
          },
          AfterBulkUpdate: async (options) => {
            const id = options.where?.id;
            if (!id) {
              return;
            }

            if (Array.isArray(id)) {
              const ids = [...new Set(id)];
              Promise.all(ids?.map((i) => {
                invalidationCache({
                  [target['primaryKeyAttribute']]: i,
                }, target)
              }))
              return;
            }

            if (typeof id !== 'object') {
              invalidationCache({
                [target['primaryKeyAttribute']]: id,
              }, target)
            }

            return;
          }
        },
      });


    target[`modelTTL`] = cacheOptions?.ttl || 0
    annotate(target, options);
  }

}