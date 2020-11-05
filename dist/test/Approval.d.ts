import { Model } from 'sequelize-typescript';
export declare class Approval extends Model<Approval> {
    idCostCenter: number;
    type: number;
    idBookingReference: number;
    group: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
}
