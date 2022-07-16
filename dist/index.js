"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = exports.RepositoryModule = void 0;
var sequelize_cache_module_1 = require("./sequelize-cache/sequelize-cache.module");
Object.defineProperty(exports, "RepositoryModule", { enumerable: true, get: function () { return sequelize_cache_module_1.SequelizeCacheModule; } });
__exportStar(require("./sequelize-cache/base-model"), exports);
var cache_1 = require("./sequelize-cache/cache");
Object.defineProperty(exports, "Cache", { enumerable: true, get: function () { return cache_1.Cache; } });
//# sourceMappingURL=index.js.map