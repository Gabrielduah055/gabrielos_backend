"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOpportunities = listOpportunities;
exports.addOpportunity = addOpportunity;
exports.getOpportunity = getOpportunity;
exports.updateOpportunity = updateOpportunity;
exports.deleteOpportunity = deleteOpportunity;
const authenticatedUser_1 = require("../../utils/authenticatedUser");
const opportunity_constants_1 = require("./opportunity.constants");
const opportunity_service_1 = require("./opportunity.service");
const requestParsing_1 = require("./requestParsing");
function parseId(res, value) {
    if (Array.isArray(value)) {
        res.status(400).json({
            message: "Invalid opportunity id.",
        });
        return null;
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            message: "Invalid opportunity id.",
        });
        return null;
    }
    return id;
}
function readOpportunityInput(req, res, requireTitle) {
    const input = {};
    if (requireTitle || req.body.title !== undefined) {
        const title = (0, requestParsing_1.readRequiredString)(res, req.body.title, "title");
        if (!title)
            return null;
        input.title = title;
    }
    const candidateId = (0, requestParsing_1.readOptionalInteger)(res, req.body.candidateId, "candidateId");
    if (res.headersSent)
        return null;
    if (candidateId !== undefined)
        input.candidateId = candidateId;
    const type = (0, requestParsing_1.readOptionalString)(req.body.type);
    if (type !== undefined) {
        if (type !== null && !(0, opportunity_constants_1.isAllowedValue)(opportunity_constants_1.OPPORTUNITY_TYPES, type)) {
            res.status(400).json({ message: "type is not allowed." });
            return null;
        }
        input.type = type;
    }
    const status = (0, requestParsing_1.readOptionalString)(req.body.status);
    if (status !== undefined) {
        if (status !== null && !(0, opportunity_constants_1.isAllowedValue)(opportunity_constants_1.OPPORTUNITY_STATUSES, status)) {
            res.status(400).json({ message: "status is not allowed." });
            return null;
        }
        input.status = status;
    }
    const priority = (0, requestParsing_1.readOptionalString)(req.body.priority);
    if (priority !== undefined) {
        if (priority !== null && !(0, opportunity_constants_1.isAllowedValue)(opportunity_constants_1.OPPORTUNITY_PRIORITIES, priority)) {
            res.status(400).json({ message: "priority is not allowed." });
            return null;
        }
        input.priority = priority;
    }
    const deadline = (0, requestParsing_1.readOptionalDate)(res, req.body.deadline, "deadline");
    if (res.headersSent)
        return null;
    if (deadline !== undefined)
        input.deadline = deadline;
    const optionalStringFields = [
        ["organization", "organization"],
        ["source", "source"],
        ["nextAction", "nextAction"],
        ["link", "link"],
        ["notes", "notes"],
    ];
    for (const [bodyKey, inputKey] of optionalStringFields) {
        const value = (0, requestParsing_1.readOptionalString)(req.body[bodyKey]);
        if (value !== undefined)
            input[inputKey] = value;
    }
    return input;
}
async function listOpportunities(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const opportunities = await (0, opportunity_service_1.listOpportunitiesForUser)(user.id);
        res.json(opportunities);
    }
    catch (error) {
        next(error);
    }
}
async function addOpportunity(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const input = readOpportunityInput(req, res, true);
        if (!input)
            return;
        const opportunity = await (0, opportunity_service_1.createOpportunityForUser)(user.id, input);
        res.status(201).json(opportunity);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Candidate")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
}
async function getOpportunity(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const opportunity = await (0, opportunity_service_1.findOpportunityForUser)(user.id, id);
        if (!opportunity) {
            return res.status(404).json({ message: "Opportunity not found." });
        }
        res.json(opportunity);
    }
    catch (error) {
        next(error);
    }
}
async function updateOpportunity(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const input = readOpportunityInput(req, res, false);
        if (!input)
            return;
        const opportunity = await (0, opportunity_service_1.updateOpportunityForUser)(user.id, id, input);
        if (!opportunity) {
            return res.status(404).json({ message: "Opportunity not found." });
        }
        res.json(opportunity);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Candidate")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
}
async function deleteOpportunity(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const opportunity = await (0, opportunity_service_1.deleteOpportunityForUser)(user.id, id);
        if (!opportunity) {
            return res.status(404).json({ message: "Opportunity not found." });
        }
        res.json(opportunity);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=opportunity.controller.js.map