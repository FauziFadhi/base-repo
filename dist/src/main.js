"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const repository_module_1 = require("./repository.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(repository_module_1.RepositoryModule);
    await app.listen(3000);
}
bootstrap();
//# sourceMappingURL=main.js.map