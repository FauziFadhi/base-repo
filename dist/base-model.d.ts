import { FindOptions, WhereAttributeHash } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { CacheKey } from './cache-utilty';
declare type ExtractRouteParams<T extends PropertyKey> = string extends T ? Record<string, string> : {
    [k in T]?: unknown;
};
export interface DefaultOptionsCache {
    ttl?: number;
    isThrow?: boolean;
}
export interface FindOptionsCache<T extends PropertyKey> extends DefaultOptionsCache {
    where?: WhereAttributeHash<ExtractRouteParams<T>>;
    order?: [string, string][];
    having?: WhereAttributeHash<any>;
    group?: string[];
}
export interface FindAllOptionsCache<T = any> extends Omit<FindOptions<T>, 'lock' | 'raw'> {
    ttl?: number;
}
export declare class BaseModel<M extends CacheKey = any, TAttributes extends {} = any, TCreate extends {} = TAttributes> extends Model<TAttributes, TCreate> {
    static caches: CacheKey;
    static modelTTL: number;
    static notFoundMessage: string;
    caches: M;
    static findOneCache<T extends BaseModel, CacheName extends keyof T['caches']>(this: {
        new (): T;
    }, cacheName: CacheName, { isThrow, ttl, ...options }?: FindOptionsCache<T['caches'][CacheName]['attributes'][number]>): Promise<T>;
    static findByPkCache<T extends BaseModel>(this: {
        new (): T;
    }, identifier: string | number, { isThrow, ttl }?: DefaultOptionsCache): Promise<T>;
    static findAllCache<T extends BaseModel>(this: {
        new (): T;
    }, { ttl, ...options }: FindAllOptionsCache<T>): Promise<T[]>;
}
export {};
