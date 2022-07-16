import { DynamicModule, Module } from '@nestjs/common';
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, OPTIONS_TYPE } from './sequelize-cache.module-definition';
import { SequelizeCacheService } from './sequelize-cache.service';

@Module({
  providers: [SequelizeCacheService]
})
export class SequelizeCacheModule extends ConfigurableModuleClass  {
 
}
