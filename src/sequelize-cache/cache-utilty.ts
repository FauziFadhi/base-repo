import * as crypto from 'crypto';
import { FindOptions, IncludeOptions } from 'sequelize';

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

  static setKey(name: string, key: string | number, options?: string): string {
    const opt = (options) ? `:${options}` : '';
    return `:${name}_${key}${opt}`;
  }

  static setQueryOptions(options?: FindOptions): string {
    const hash = crypto.createHash('md5');
    CacheUtility.cleanOptions(options)
    return ((Object.keys(options).length === 0) ? 'all' : hash.update(JSON.stringify(options)).digest('base64'));
  }

  static getKeyTime(key: string): number {
    const str = key.split('_')
    return parseInt(str.slice(-1)[0], 10);
  }

  // for list cache usage
  static setResult(result: string): any {
    return JSON.parse(result)
  }


  static setOneQueryOptions(options?: FindOptions): string {
    const hash = crypto.createHash('md5');
    CacheUtility.cleanOptions(options)
    return ((Object.keys(options).length === 0) ? 'one' : hash.update(JSON.stringify(options)).digest('base64'));
  }

  private static cleanOptions(options?: FindOptions) {
    CacheUtility.cleanIncludeOptions(options?.include as IncludeOptions)
  }

  private static cleanIncludeOptions<T extends IncludeOptions>(include: T | T[]): T | T[] {
    if(!include)
    return;
    if(Array.isArray(include)) {
      include.forEach((include) => {
        delete include.association;

        if(include?.include) 
          CacheUtility.cleanIncludeOptions(include?.include as IncludeOptions)
      })
    } else {
      delete include.association;
      
      if(include?.include) 
          CacheUtility.cleanIncludeOptions(include?.include as IncludeOptions)
    }
  }
}

export default CacheUtility;