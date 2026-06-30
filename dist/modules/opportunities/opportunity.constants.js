"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPPORTUNITY_PRIORITIES = exports.OPPORTUNITY_STATUSES = exports.CANDIDATE_STATUSES = exports.SCOUT_GOAL_FREQUENCIES = exports.OPPORTUNITY_TYPES = void 0;
exports.isAllowedValue = isAllowedValue;
exports.OPPORTUNITY_TYPES = [
    "job",
    "scholarship",
    "school_pilot",
    "client_lead",
    "contract",
    "business",
    "research",
    "grant",
    "other",
];
exports.SCOUT_GOAL_FREQUENCIES = ["daily", "weekly", "monthly"];
exports.CANDIDATE_STATUSES = [
    "pending",
    "approved",
    "ignored",
    "rejected",
];
exports.OPPORTUNITY_STATUSES = [
    "saved",
    "interested",
    "contacted",
    "applied",
    "follow_up",
    "negotiating",
    "won",
    "lost",
    "archived",
];
exports.OPPORTUNITY_PRIORITIES = ["low", "medium", "high"];
function isAllowedValue(values, value) {
    return typeof value === "string" && values.includes(value);
}
//# sourceMappingURL=opportunity.constants.js.map