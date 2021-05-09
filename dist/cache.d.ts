import { CacheKey } from './cache-utilty';
export declare function Cache(cacheOptions: {
    ttl?: number;
    caches?: readonly CacheKey[];
}): (target: any) => void;
