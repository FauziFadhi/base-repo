import * as Redis from 'ioredis';
import { FindOptions } from 'sequelize';
export declare class CacheUtility {
    static setKey(name: string, key: any, options?: any): string;
    static setQueryOptions(options?: FindOptions): string;
    static getKeyTime(key: string): number;
    static invalidate(key: any, cacheStore: Redis.Redis): Promise<boolean>;
    static setResult(result: string): any;
    static flush(cacheStore: Redis.Redis): void;
    static setOneQueryOptions(options?: FindOptions): string;
}
export default CacheUtility;
