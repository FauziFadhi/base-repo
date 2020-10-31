import { Repository } from 'base-repository';
import { Approval } from './Approval';
export declare class ApprovalRepository extends Repository<Approval> {
    constructor();
    invalidateCache(model: Approval): void;
    test(): Promise<Approval[]>;
}
