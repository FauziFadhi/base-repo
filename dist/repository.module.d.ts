import { DynamicModule } from '@nestjs/common';
export declare class RepositoryModule {
    static defaultTTL: number;
    static redisClient: any;
    static forRoot(defaultTTL?: number): DynamicModule;
    static forRootAsync(): DynamicModule;
}
