import { FindOptions, QueryOptions } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { CacheKey } from './cache-utilty';
declare type UnusedOptionsAttribute = 'lock' | 'raw' | 'skipLocked' | keyof QueryOptions;
export interface DefaultOptionsCache {
    ttl?: number;
    rejectOnEmpty?: boolean | Error;
}
export interface FindAllNestedOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute>, DefaultOptionsCache {
    ttl: number;
}
export interface FindAllOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute | 'include'>, DefaultOptionsCache {
}
export declare class BaseModel<TAttributes extends {} = any, TCreate extends {} = TAttributes> extends Model<TAttributes, TCreate> {
    static caches: CacheKey;
    static modelTTL: number;
    private static defaultNotFoundMessage;
    private static notFoundException;
    static notFoundMessage: any;
    static findOneCache<T extends BaseModel>(this: {
        new (): T;
    }, { ttl, ...options }: FindAllNestedOptionsCache<T['_attributes']> | FindAllOptionsCache<T['_attributes']>): Promise<T>;
    static findByPkCache<T extends BaseModel>(this: {
        new (): T;
    }, identifier: string | number, options?: Omit<FindAllNestedOptionsCache<T['_attributes']>, 'where'> | Omit<FindAllOptionsCache<T['_attributes']>, 'where'>): Promise<T>;
    private static rejectOnEmptyMode;
    static findAllCache<T extends BaseModel>(this: {
        new (): T;
    }, { ttl, ...options }: FindAllOptionsCache<T>): Promise<T[]>;
}
export {};
