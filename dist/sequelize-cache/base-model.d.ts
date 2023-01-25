import { Attributes, CountOptions, CountWithOptions, FindOptions, GroupedCountResultItem, Model as SequelizeModel, ModelStatic, QueryOptions, ScopeOptions, WhereAttributeHash } from 'sequelize';
import { Model as TSModel } from 'sequelize-typescript';
declare type UnusedOptionsAttribute = 'lock' | 'skipLocked' | keyof Omit<QueryOptions, 'replacements' | 'bind' | 'type' | 'nest' | 'raw'>;
export interface DefaultOptionsCache {
    rejectOnEmpty: boolean | Error;
}
export interface FindAllNestedOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute> {
    ttl: number;
    rejectOnEmpty?: boolean | Error;
}
export interface FindAllOptionsCache<T = any> extends Omit<FindOptions<T>, UnusedOptionsAttribute | 'include'> {
    ttl?: number;
    rejectOnEmpty?: boolean | Error;
}
export declare class Model<TAttributes extends {} = any, TCreate extends {} = TAttributes> extends TSModel<TAttributes, TCreate> {
    static modelTTL: number;
    static onUpdateAttribute: string;
    private static defaultNotFoundMessage;
    private static notFoundException;
    static notFoundMessage: any;
    static findOneCache<T extends Model>(this: {
        new (): T;
    }, options?: FindAllNestedOptionsCache<T['_attributes']>): Promise<T | null>;
    static findOneCache<T extends Model>(this: {
        new (): T;
    }, options?: FindAllOptionsCache<T['_attributes']>): Promise<T | null>;
    static findOneCache<T extends Model>(this: {
        new (): T;
    }, options?: FindAllNestedOptionsCache<T['_attributes']> & DefaultOptionsCache): Promise<T>;
    static findOneCache<T extends Model>(this: {
        new (): T;
    }, options?: FindAllOptionsCache<T['_attributes']> & DefaultOptionsCache): Promise<T>;
    static findByPkCache<T extends Model>(this: {
        new (): T;
    }, identifier: string | number, options?: Omit<FindAllNestedOptionsCache<T['_attributes']>, 'where'>): Promise<T | null>;
    static findByPkCache<T extends Model>(this: {
        new (): T;
    }, identifier: string | number, options?: Omit<FindAllOptionsCache<T['_attributes']>, 'where'>): Promise<T | null>;
    static findByPkCache<T extends Model>(this: {
        new (): T;
    }, identifier: string | number, options?: Omit<FindAllNestedOptionsCache<T['_attributes']>, 'where'> & DefaultOptionsCache): Promise<T>;
    static findByPkCache<T extends Model>(this: {
        new (): T;
    }, identifier: string | number, options?: Omit<FindAllOptionsCache<T['_attributes']>, 'where'> & DefaultOptionsCache): Promise<T>;
    private static rejectOnEmptyMode;
    static findAllCache<T extends Model>(this: {
        new (): T;
    }, options: FindAllNestedOptionsCache<T['_attributes']>): Promise<T[]>;
    static scopes<M extends SequelizeModel>(this: ModelStatic<M>, options?: string | ScopeOptions | readonly (string | ScopeOptions)[] | WhereAttributeHash<M>): typeof Model & {
        new (): M;
    };
    static countCache<M extends Model>(this: ModelStatic<M>, ttl: number, options?: Omit<CountOptions<Attributes<M>>, 'group'>): Promise<number>;
    static countCache<M extends Model>(this: ModelStatic<M>, ttl: number, options: CountWithOptions<Attributes<M>>): Promise<GroupedCountResultItem[]>;
}
export {};
