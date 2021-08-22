import { circularToJSON } from 'helpers';
import { RepositoryModule } from 'repository.module';
import { addOptions } from 'sequelize-typescript';


async function invalidateCache(model, options, modelClass) {
  const previousModel = { ...model['dataValues'], ...circularToJSON(model['_previousDataValues']) }

  console.log('previousModel', previousModel);
  if (options?.transaction) {
    options.transaction.afterCommit(() => {
      invalidationCache(previousModel, modelClass)
    })
    console.log('hooks after update transaction');
    return model
  }
  invalidationCache(previousModel, modelClass)
  console.log('hooks after update');
  return model

}

function annotate(target, options: { hooks }) {
  addOptions(target.prototype, options)
}
async function invalidationCache(previousModel, modelClass) {
  const keys: string[] = await RepositoryModule.catchKeyGetter({ keyPattern: `*:${modelClass.name}*:${previousModel[modelClass['primaryKeyAttribute']]}` })
  const invalidation = RepositoryModule.cacheInvalidate;
  await Promise.all(keys.map(async (key) => await invalidation({ key })))
}


export function Cache(cacheOptions: { ttl?: number }) {
  return (target) => {

    const options: { hooks } = Object.assign({},
      {
        hooks: {
          afterUpdate: async (instance, options) => {
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


    target[`modelTTL`] = cacheOptions.ttl || 0
    annotate(target, options);
  }

}