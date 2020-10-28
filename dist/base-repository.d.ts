import { Model } from 'sequelize-typescript';
import { FindAndCountOptions, FindOptions, Transaction } from 'sequelize/types';
export declare abstract class Repository<T extends Model<T>> {
    private cacheModel;
    private model;
    private cacheStore;
    private db;
    private MEDIUM_TTL;
    constructor(model: any, cacheModel: string);
    cacheInvalidation(model: any, options: any, onWhat: string): any;
    protected abstract invalidateCache(model: T): Promise<void>;
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
    paginate(options?: FindAndCountOptions): Promise<{
        rows: T[];
        count: number;
    }>;
    list(options?: FindOptions): Promise<T[]>;
    listCache(options?: FindOptions, includeDeleted?: boolean): Promise<T[]>;
    private getDataOrThrow;
    private getDataOrThrowFromCache;
    findOne(options?: FindOptions, isThrow?: boolean, includeDeleted?: boolean): Promise<T>;
    findById(id: number, isThrow?: boolean, includeDeleted?: boolean): Promise<T>;
    findByIdCache: (id: number, isThrow?: boolean, includeDeleted?: boolean) => Promise<T>;
    protected findByOneAttributeCache({ name, value }: {
        name: any;
        value: any;
    }, isThrow?: boolean, includeDeleted?: boolean): Promise<T>;
    protected findByMultiAttributeCache(key: string, options: FindOptions, isThrow?: boolean, includeDeleted?: boolean): Promise<T>;
    private getDataModelFromCache;
    protected softDelete(dataModel: any, transaction?: Transaction): Promise<T>;
}
