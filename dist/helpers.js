"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circularToJSON = exports.textToSnakeCase = void 0;
exports.textToSnakeCase = (text) => {
    return text
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('_');
};
exports.circularToJSON = circular => JSON.parse(JSON.stringify(circular));
//# sourceMappingURL=helpers.js.map