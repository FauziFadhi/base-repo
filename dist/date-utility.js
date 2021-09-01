"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtility = void 0;
class DateUtility {
    static convertDateTimeToEpoch(datetime, onSec = false) {
        return new Date(String(datetime)).getTime() || 0;
    }
}
exports.DateUtility = DateUtility;
//# sourceMappingURL=date-utility.js.map