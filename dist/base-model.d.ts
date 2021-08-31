import { FindOptions, Model as SequelizeModel, ModelStatic, QueryOptions, ScopeOptions, WhereAttributeHash } from 'sequelize';
import { Model as TSModel } from 'sequelize-typescript';
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
export declare class Model<TAttributes extends {} = any, TCreate extends {} = TAttributes> extends TSModel<TAttributes, TCreate> {
    static caches: CacheKey;
    static modelTTL: number;
    private static defaultNotFoundMessage;
    private static notFoundException;
    static notFoundMessage: any;
    static findOneCache<T extends Model>(this: {
        new (): T;
    }, options?: FindAllNestedOptionsCache<T['_attributes']> | FindAllOptionsCache<T['_attributes']>): Promise<T>;
    static findByPkCache<T extends Model>(this: {
        new (): T;
    }, identifier: string | number, options?: Omit<FindAllNestedOptionsCache<T['_attributes']>, 'where'> | Omit<FindAllOptionsCache<T['_attributes']>, 'where'>): Promise<T>;
    private static rejectOnEmptyMode;
    static findAllCache<T extends Model>(this: {
        new (): T;
    }, options?: FindAllNestedOptionsCache<T> | FindAllOptionsCache<T>): Promise<T[]>;
    static scopes<M extends SequelizeModel>(this: ModelStatic<M>, options?: string | ScopeOptions | readonly (string | ScopeOptions)[] | WhereAttributeHash<M>): typeof Model & {
        new (): M;
    };
}
export {};
