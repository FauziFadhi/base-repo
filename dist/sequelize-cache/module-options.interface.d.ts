export interface SequelizeCacheModuleOptions {
    defaultTTL: number;
    logging?: boolean;
    log?: (value: any) => void;
    callbackSet: ({ key, value, ttl }: {
        key: string;
        value: string;
        ttl: number;
    }) => Promise<unknown>;
    callbackGet: ({ key }: {
        key: string;
    }) => Promise<string>;
    callbackInvalidate: ({ key }: {
        key: string;
    }) => unknown;
    callbackGetKey: ({ keyPattern }: {
        keyPattern: string;
    }) => Promise<any>;
}
