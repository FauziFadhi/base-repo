import { DynamicModule, Module } from '@nestjs/common';

@Module({

})
export class RepositoryModule {
  static defaultTTL: number
  static catchSetter: ({ key, value, ttl }: { key: string, value: string, ttl: number }) => Promise<unknown>
  static catchGetter: ({ key }: { key: string }) => Promise<string>
  static catchKeyGetter: ({ keyPattern }: { keyPattern: string }) => Promise<any>
  static cacheInvalidate: ({ key }: { key: string }) => unknown
  static forRoot<Set, Invalidate>({ defaultTTL, callbackGet, callbackSet, callbackInvalidate, callbackGetKey }: {
    defaultTTL: number,
    callbackSet: ({ key, value, ttl }: { key: string, value: string, ttl: number }) => Promise<unknown>,
    callbackGet: ({ key }: { key: string }) => Promise<string>,
    callbackInvalidate: ({ key }: { key: string }) => unknown,
    callbackGetKey: ({ keyPattern }: { keyPattern: string }) => Promise<any>
  }): DynamicModule {
    RepositoryModule.defaultTTL = defaultTTL
    RepositoryModule.catchGetter = callbackGet
    RepositoryModule.catchSetter = callbackSet
    RepositoryModule.cacheInvalidate = callbackInvalidate
    RepositoryModule.catchKeyGetter = callbackGetKey
    return {
      module: RepositoryModule,
    };
  }
}
