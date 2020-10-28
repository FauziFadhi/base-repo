import { DynamicModule } from '@nestjs/common';
export declare class RepositoryModule {
    static sequelize: any;
    static defaultTTL: number;
    static forRoot(sequelize: any, defaultTTL?: number): DynamicModule;
}
