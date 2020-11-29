import { Model, Sequelize } from 'sequelize-typescript';
import { FindAndCountOptions, FindOptions } from 'sequelize/types';
import { GetOptions, getOptionsCache, ListGetOptionsCache } from './base-repository';
declare type Constructor<T> = {
    new (): T;
};
export declare class BaseModel<T> extends Model<T, BaseModel<T>> {
    static cacheStore: any;
    static db: typeof Sequelize;
    static cacheModel: string;
    protected static invalidateCache<T extends Model>(model: T): void;
    protected static setRedisClient(): void;
    static invalidateModelCache(model: any, options: any): any;
    protected static setKeyOneAttribute(attributeName: string, attributeValue: any): string;
    protected static setKeyMultiAttribute(key: any): string;
    protected static setInvalidateCache(key: any): void;
    private static getNewModelClass;
    protected static defaultThrow<M extends Model<M>>(this: {
        new (): M;
    } & typeof BaseModel): void;
    protected static setCacheStore(cacheStore: any): void;
    protected static getCacheStore(): any;
    protected static getDbConfig(): typeof Sequelize;
    protected static getCacheModel(): string;
    private static throwNullOrDeleted;
    private static getAllFindByCacheName;
    private static invalidateAllFindByCache;
    private static invalidateAllCache;
    static paginate<M extends Model<M>>(this: {
        new (): M;
    } & typeof BaseModel, options: FindAndCountOptions & {
        includeDeleted?: boolean;
    }): Promise<{
        rows: M[];
        count: number;
    }>;
    static list<M extends Model<M>>(this: {
        new (): M;
    } & typeof BaseModel, options: FindOptions & {
        includeDeleted?: boolean;
    }): Promise<M[]>;
    static listCache<M extends Model<M>>(this: {
        new (): M;
    } & typeof BaseModel, option?: FindOptions & ListGetOptionsCache): Promise<M[]>;
    private static getDataOrThrow;
    private static getDataOrThrowFromCache;
    private static createInstance;
    static getOne<T extends Model>(this: Constructor<T> & typeof BaseModel, options: FindOptions & GetOptions): Promise<T>;
    static findById<T extends Model>(this: Constructor<T> & typeof BaseModel, id: number, getOptions?: GetOptions): Promise<T>;
    static findByIdCache<M extends Model>(this: {
        new (): M;
    } & typeof BaseModel, id: number, getOptions?: getOptionsCache): Promise<M>;
    protected static findByOneAttributeCache<M extends Model>(this: {
        new (): M;
    } & typeof BaseModel, { name, value }: {
        name: any;
        value: any;
    }, getOptionsCaches?: FindOptions & getOptionsCache): Promise<M>;
    protected static findByMultiAttributeCache<M extends Model<M>>(this: {
        new (): M;
    } & typeof BaseModel, key: string, getOptionsCaches: FindOptions & getOptionsCache): Promise<M>;
    private static getDataModelFromCache;
}
export {};
