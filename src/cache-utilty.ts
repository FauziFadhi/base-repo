import * as crypto from 'crypto';
import * as Redis from 'ioredis';
import { RepositoryModule } from 'repository.module';
import { FindOptions } from 'sequelize';

export class CacheUtility {

  static setKey(name: string, key: any, options?: any) {
    // tslint:disable-next-line:prefer-template
    const opt = (options) ? ':' + options : '';
    // tslint:disable-next-line:prefer-template
    return RepositoryModule.cachePrefix + ':' + name + opt + '_' + key;
  }

  static setQueryOptions(options?: FindOptions) {
    const hash = crypto.createHash('md5');
    return ((Object.keys(options).length === 0) ? 'all' : hash.update(JSON.stringify(options)).digest('base64'));
  }

  static getKeyTime(key: string): number {
    const str = key.split('_')
    return parseInt(str.slice(-1)[0], 10);
  }

  // for redis usage
  static async invalidate(key: any, cacheStore: Redis.Redis): Promise<boolean> {
    return await cacheStore.del(key) === 1 ? true : false;
  }

  // for list cache usage
  static setResult(result: string) {
    return JSON.parse(result)
  }

  static flush(cacheStore: Redis.Redis) {
    cacheStore.flushall()
  }

  static setOneQueryOptions(options?: FindOptions) {
    const hash = crypto.createHash('md5');
    return ((Object.keys(options).length === 0) ? 'one' : hash.update(JSON.stringify(options)).digest('base64'));
  }
}

export default CacheUtility;