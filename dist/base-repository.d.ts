import { Model } from 'sequelize-typescript';
import { BulkCreateOptions, CountOptions, FindAndCountOptions, FindOptions, FindOrCreateOptions, Transaction, UpdateOptions } from 'sequelize/types';
export declare class GetOptions {
    isThrow?: boolean;
    includeDeleted?: boolean;
}
export declare class getOptionsCache extends GetOptions {
    ttl?: number;
}
export declare class ListGetOptionsCache {
    ttl?: number;
    includeDeleted?: boolean;
}
export declare abstract class Repository<T extends Model<T>> {
    private cacheModel;
    private model;
    private cacheStore;
    private db;
    constructor(model: any, cacheModel: string);
    protected abstract invalidateCache(model: T): any;
    protected setKeyMultiAttribute(key: any): string;
    protected setInvalidateCache(key: any): void;
    private getNewModelClass;
    protected defaultThrow(): void;
    protected setCacheStore(cacheStore: any): void;
    protected getCacheStore(): any;
    protected getDbConfig(): any;
    private setDbConfig;
    protected getCacheModel(): string;
    private throwNullOrDeleted;
    protected setKeyOneAttribute(attributeName: string, attributeValue: any): string;
    private getAllFindByCacheName;
    private invalidateAllFindByCache;
    private invalidateAllCache;
    paginate(options?: FindAndCountOptions & {
        includeDeleted: boolean;
    }): Promise<{
        rows: T[];
        count: number;
    }>;
    list(options?: FindOptions & {
        includeDeleted: boolean;
    }): Promise<T[]>;
    listCache(option?: FindOptions & ListGetOptionsCache): Promise<T[]>;
    private getDataOrThrow;
    private getDataOrThrowFromCache;
    findOne(options: FindOptions & GetOptions): Promise<T>;
    findById(id: number, getOptions?: GetOptions): Promise<T>;
    findByIdCache: (id: number, getOptions?: getOptionsCache) => Promise<T>;
    protected findByOneAttributeCache({ name, value }: {
        name: any;
        value: any;
    }, getOptionsCaches?: FindOptions & getOptionsCache): Promise<T>;
    protected findByMultiAttributeCache(key: string, getOptionsCaches: FindOptions & getOptionsCache): Promise<T>;
    private getDataModelFromCache;
    protected softDelete(dataModel: any, transaction?: Transaction): Promise<T>;
    createModel(values: object, transaction?: Transaction): Promise<T>;
    bulkUpdate(values: object, options: UpdateOptions, transaction?: Transaction): Promise<[number, T[]]>;
    bulkCreate(values: object[], options?: BulkCreateOptions, transaction?: Transaction): Promise<T[]>;
    findOrCreate(options: FindOrCreateOptions, transaction: Transaction): Promise<[T, boolean]>;
    findOrBuild(options: FindOrCreateOptions, transaction?: Transaction): Promise<[T, boolean]>;
    count(options: CountOptions): Promise<number>;
}
