export declare class SequelizeCache {
    static defaultTTL: number;
    static log: (value: any) => void;
    static showLog: boolean;
    static logging(value: any): void;
    static catchSetter: ({ key, value, ttl }: {
        key: string;
        value: string;
        ttl: number;
    }) => Promise<unknown>;
    static catchGetter: ({ key }: {
        key: string;
    }) => Promise<string>;
    static catchKeyGetter: ({ keyPattern }: {
        keyPattern: string;
    }) => Promise<any>;
    static cacheInvalidate: ({ key }: {
        key: string;
    }) => unknown;
}
