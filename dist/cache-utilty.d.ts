import { FindOptions } from 'sequelize';
export interface CacheKey {
    readonly name: string;
    readonly attributes: readonly string[];
}
export declare class CacheUtility {
    static setKey(name: string, key: any, options?: any): string;
    static setQueryOptions(options?: FindOptions): string;
    static getKeyTime(key: string): number;
    static setResult(result: string): any;
    static setOneQueryOptions(options?: FindOptions): string;
}
export default CacheUtility;
