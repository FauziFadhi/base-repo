import { Inject, Injectable } from "@nestjs/common";
import { SequelizeCacheModuleOptions } from "./module-options.interface";
import { SequelizeCache } from "./sequelize-cache";
import { MODULE_OPTIONS_TOKEN } from "./sequelize-cache.module-definition";

@Injectable()
export class SequelizeCacheService {

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private options: SequelizeCacheModuleOptions
  ) {
    SequelizeCache.cacheInvalidate = options.callbackInvalidate
    SequelizeCache.catchGetter = options.callbackGet
    SequelizeCache.defaultTTL = options.defaultTTL
    SequelizeCache.catchSetter = options.callbackSet
    SequelizeCache.catchKeyGetter = options.callbackGetKey
    SequelizeCache.log = options.log
    SequelizeCache.showLog = options.logging
  }

}1