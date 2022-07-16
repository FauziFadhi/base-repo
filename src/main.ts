import { NestFactory } from '@nestjs/core';

import { SequelizeCacheModule } from './sequelize-cache/sequelize-cache.module';

async function bootstrap() {
  const app = await NestFactory.create(SequelizeCacheModule);
  await app.listen(3000);
}
bootstrap();
