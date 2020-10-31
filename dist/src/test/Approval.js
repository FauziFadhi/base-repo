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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Approval = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
let Approval = class Approval extends sequelize_typescript_1.Model {
};
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.SMALLINT }),
    __metadata("design:type", Number)
], Approval.prototype, "type", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.SMALLINT }),
    __metadata("design:type", Number)
], Approval.prototype, "idBookingReference", void 0);
__decorate([
    sequelize_typescript_1.Column({ type: sequelize_typescript_1.DataType.SMALLINT }),
    __metadata("design:type", Number)
], Approval.prototype, "group", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    sequelize_typescript_1.Column({ field: 'created_at' }),
    __metadata("design:type", Date)
], Approval.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    sequelize_typescript_1.Column({ field: 'updated_at' }),
    __metadata("design:type", Date)
], Approval.prototype, "updatedAt", void 0);
__decorate([
    sequelize_typescript_1.Column({ field: 'is_deleted', defaultValue: 'f', type: sequelize_typescript_1.DataType.BOOLEAN }),
    __metadata("design:type", Boolean)
], Approval.prototype, "isDeleted", void 0);
Approval = __decorate([
    sequelize_typescript_1.Scopes(() => ({
        notDeleted: {
            where: {
                isDeleted: false,
            },
        },
    })),
    sequelize_typescript_1.Table({
        tableName: 'approval',
    })
], Approval);
exports.Approval = Approval;
//# sourceMappingURL=Approval.js.map