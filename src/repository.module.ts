import { DynamicModule, Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class RepositoryModule {
  static sequelize
  static defaultTTL: number
  static forRoot(sequelize, defaultTTL?: number): DynamicModule {
    RepositoryModule.sequelize = sequelize
    RepositoryModule.defaultTTL = defaultTTL || 7 * 24 * 3600
    return {
      module: RepositoryModule
    };
  }
}
