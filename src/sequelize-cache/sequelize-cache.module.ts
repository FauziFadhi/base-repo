import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './sequelize-cache.module-definition';
import { SequelizeCacheService } from './sequelize-cache.service';

@Module({
  providers: [SequelizeCacheService]
})
export class SequelizeCacheModule extends ConfigurableModuleClass  {
 
}
