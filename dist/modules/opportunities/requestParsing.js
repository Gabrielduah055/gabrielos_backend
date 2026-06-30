"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readOptionalString = readOptionalString;
exports.readRequiredString = readRequiredString;
exports.readOptionalNumber = readOptionalNumber;
exports.readOptionalInteger = readOptionalInteger;
exports.readOptionalBoolean = readOptionalBoolean;
exports.readOptionalDate = readOptionalDate;
exports.readOptionalTextOrJson = readOptionalTextOrJson;
function readOptionalString(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}
function readRequiredString(res, value, fieldName) {
    if (typeof value !== "string" || value.trim() === "") {
        res.status(400).json({
            message: `${fieldName} is required.`,
        });
        return null;
    }
    return value.trim();
}
function readOptionalNumber(res, value, fieldName) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null || value === "") {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        res.status(400).json({
            message: `${fieldName} must be a number.`,
        });
        return undefined;
    }
    return parsed;
}
function readOptionalInteger(res, value, fieldName) {
    const parsed = readOptionalNumber(res, value, fieldName);
    if (parsed === undefined || parsed === null) {
        return parsed;
    }
    if (!Number.isInteger(parsed)) {
        res.status(400).json({
            message: `${fieldName} must be an integer.`,
        });
        return undefined;
    }
    return parsed;
}
function readOptionalBoolean(value) {
    return typeof value === "boolean" ? value : undefined;
}
function readOptionalDate(res, value, fieldName) {
    const parsed = readOptionalString(value);
    if (parsed === undefined || parsed === null) {
        return parsed;
    }
    if (Number.isNaN(Date.parse(parsed))) {
        res.status(400).json({
            message: `${fieldName} must be a valid date.`,
        });
        return undefined;
    }
    return parsed;
}
function readOptionalTextOrJson(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
    }
    return JSON.stringify(value);
}
//# sourceMappingURL=requestParsing.js.map