import { Sequelize } from 'sequelize/types';

export class RepositoryModule {
  static sequelize
  static defaultTTL: number
  constructor(sequelize: Sequelize, defaultTTL?: number) {
    RepositoryModule.sequelize = sequelize
    RepositoryModule.defaultTTL = defaultTTL || 7 * 24 * 3600
  }
}
