import { CacheKey } from './cache-utilty';
export declare function Cache(cacheOptions: {
    ttl?: number;
    caches: CacheKey;
}): (target: any) => void;
