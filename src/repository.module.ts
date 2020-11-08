import { DynamicModule, Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class RepositoryModule {
  static sequelize
  static cachePrefix
  static defaultTTL: number
  static forRoot(sequelize, cachePrefix, defaultTTL: number = 7 * 24 * 3600): DynamicModule {
    RepositoryModule.sequelize = sequelize
    RepositoryModule.cachePrefix = cachePrefix
    RepositoryModule.defaultTTL = defaultTTL
    return {
      module: RepositoryModule
    };
  }
  static forRootAsync({ useFactory }): DynamicModule {
    RepositoryModule.sequelize = useFactory.sequelize
    RepositoryModule.cachePrefix = useFactory.cachePrefix
    RepositoryModule.defaultTTL = useFactory.defaultTTL || 7 * 24 * 3600

    return {
      module: RepositoryModule
    }
  }
}
