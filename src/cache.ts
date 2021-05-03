import { Model as SequelizeModel } from 'sequelize';
import { addOptions } from 'sequelize-typescript';

import { CacheKey } from './cache-utilty';

function invalidateCache(model, options, keys: CacheKey[]) {
  console.log('model', model);
  console.log('options', options);
  console.log('keys', keys);
  const previousModel = { ...model['dataValues'], ...model['_previousDataValues'] }

  if (options?.transaction) {

    return model
  }

  console.log('hooks after update');
}

function annotate(target, options: { hooks }) {
  addOptions(target.prototype, options)
}

export function Cache<M extends SequelizeModel = SequelizeModel>(target): void {
  const options: { hooks } = Object.assign({},
    {
      hooks: {
        afterUpdate: (instance, options) => {
          return invalidateCache(instance, options, target.keys)
        },
        afterDestroy: (instance, options) => {
          return invalidateCache(instance, options, target.keys)
        },
        beforeBulkUpdate: function (options) {
          options.individualHooks = true;
        }
      },
    });

  console.log('cache2');
  console.log(target);
  annotate(target, options);
}