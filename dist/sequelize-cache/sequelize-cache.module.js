"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeCacheModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_cache_module_definition_1 = require("./sequelize-cache.module-definition");
const sequelize_cache_service_1 = require("./sequelize-cache.service");
let SequelizeCacheModule = class SequelizeCacheModule extends sequelize_cache_module_definition_1.ConfigurableModuleClass {
};
SequelizeCacheModule = __decorate([
    (0, common_1.Module)({
        providers: [sequelize_cache_service_1.SequelizeCacheService]
    })
], SequelizeCacheModule);
exports.SequelizeCacheModule = SequelizeCacheModule;
//# sourceMappingURL=sequelize-cache.module.js.map