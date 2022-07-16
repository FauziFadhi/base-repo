"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const sequelize_cache_module_1 = require("./sequelize-cache/sequelize-cache.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(sequelize_cache_module_1.SequelizeCacheModule);
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map