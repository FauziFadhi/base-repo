import { ConfigurableModuleBuilder } from "@nestjs/common";
import { SequelizeCacheModuleOptions } from "./module-options.interface";

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, ASYNC_OPTIONS_TYPE, OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<SequelizeCacheModuleOptions>().build();