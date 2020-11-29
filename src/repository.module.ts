import { DynamicModule, Module } from '@nestjs/common';

@Module({

})
export class RepositoryModule {
  static defaultTTL: number
  static redisClient
  static forRoot(defaultTTL: number = 7 * 24 * 3600): DynamicModule {
    RepositoryModule.defaultTTL = defaultTTL

    return {
      module: RepositoryModule,
    };
  }
  static forRootAsync(): DynamicModule {
    // RepositoryModule.defaultTTL = useFactory().defaultTTL
    // RepositoryModule.redisClient = useFactory().redisClient

    return {
      module: RepositoryModule,
      //   imports: inject
    }
  }
}
