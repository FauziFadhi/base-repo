"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeCacheService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_cache_1 = require("./sequelize-cache");
const sequelize_cache_module_definition_1 = require("./sequelize-cache.module-definition");
let SequelizeCacheService = class SequelizeCacheService {
    constructor(options) {
        this.options = options;
        sequelize_cache_1.SequelizeCache.cacheInvalidate = options.callbackInvalidate;
        sequelize_cache_1.SequelizeCache.catchGetter = options.callbackGet;
        sequelize_cache_1.SequelizeCache.defaultTTL = options.defaultTTL;
        sequelize_cache_1.SequelizeCache.catchSetter = options.callbackSet;
        sequelize_cache_1.SequelizeCache.catchKeyGetter = options.callbackGetKey;
        sequelize_cache_1.SequelizeCache.log = options.log;
        sequelize_cache_1.SequelizeCache.showLog = options.logging;
    }
};
SequelizeCacheService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sequelize_cache_module_definition_1.MODULE_OPTIONS_TOKEN)),
    __metadata("design:paramtypes", [Object])
], SequelizeCacheService);
exports.SequelizeCacheService = SequelizeCacheService;
1;
//# sourceMappingURL=sequelize-cache.service.js.map