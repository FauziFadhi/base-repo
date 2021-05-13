import * as crypto from 'crypto';
import { FindOptions } from 'sequelize';

export interface CacheKeyAtt {
  readonly attributes: readonly string[]
  readonly havingAttributes?: readonly string[]
  readonly order?: readonly string[]
  readonly group?: readonly string[]
}
export interface CacheKey {
  readonly [key: string]: CacheKeyAtt
}

export class CacheUtility {

  static setKey(name: string, key: any, options?: any) {
    // tslint:disable-next-line:prefer-template
    const opt = (options) ? ':' + options : '';
    // tslint:disable-next-line:prefer-template
    return ':' + name + opt + '_' + key;
  }

  static setQueryOptions(options?: FindOptions) {
    const hash = crypto.createHash('md5');
    return ((Object.keys(options).length === 0) ? 'all' : hash.update(JSON.stringify(options)).digest('base64'));
  }

  static getKeyTime(key: string): number {
    const str = key.split('_')
    return parseInt(str.slice(-1)[0], 10);
  }

  // for list cache usage
  static setResult(result: string) {
    return JSON.parse(result)
  }


  static setOneQueryOptions(options?: FindOptions) {
    const hash = crypto.createHash('md5');
    return ((Object.keys(options).length === 0) ? 'one' : hash.update(JSON.stringify(options)).digest('base64'));
  }
}

export default CacheUtility;