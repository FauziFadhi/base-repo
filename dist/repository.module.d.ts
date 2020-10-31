import { DynamicModule } from '@nestjs/common';
export declare class RepositoryModule {
    static sequelize: any;
    static cachePrefix: any;
    static defaultTTL: number;
    static forRoot(sequelize: any, cachePrefix: any, defaultTTL?: number): DynamicModule;
    static forRootAsync({ useFactory }: {
        useFactory: any;
    }): DynamicModule;
}
