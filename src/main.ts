import { NestFactory } from '@nestjs/core';

import { RepositoryModule } from './repository.module';

async function bootstrap() {
  const app = await NestFactory.create(RepositoryModule);
  await app.listen(3000);
}
bootstrap();
