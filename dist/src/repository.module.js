"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RepositoryModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryModule = void 0;
const common_1 = require("@nestjs/common");
let RepositoryModule = RepositoryModule_1 = class RepositoryModule {
    static forRoot(sequelize, cachePrefix, defaultTTL) {
        RepositoryModule_1.sequelize = sequelize;
        RepositoryModule_1.cachePrefix = cachePrefix;
        RepositoryModule_1.defaultTTL = defaultTTL || 7 * 24 * 3600;
        return {
            module: RepositoryModule_1
        };
    }
    static forRootAsync({ useFactory }) {
        RepositoryModule_1.sequelize = useFactory.sequelize;
        RepositoryModule_1.cachePrefix = useFactory.cachePrefix;
        RepositoryModule_1.defaultTTL = useFactory.defaultTTL || 7 * 24 * 3600;
        return {
            module: RepositoryModule_1
        };
    }
};
RepositoryModule = RepositoryModule_1 = __decorate([
    common_1.Module({
        imports: [],
        controllers: [],
        providers: [],
    })
], RepositoryModule);
exports.RepositoryModule = RepositoryModule;
//# sourceMappingURL=repository.module.js.map