"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCandidates = listCandidates;
exports.addCandidate = addCandidate;
exports.getCandidate = getCandidate;
exports.updateCandidate = updateCandidate;
exports.deleteCandidate = deleteCandidate;
exports.approveCandidate = approveCandidate;
exports.ignoreCandidate = ignoreCandidate;
const authenticatedUser_1 = require("../../utils/authenticatedUser");
const opportunity_constants_1 = require("../opportunities/opportunity.constants");
const requestParsing_1 = require("../opportunities/requestParsing");
const opportunityCandidate_service_1 = require("./opportunityCandidate.service");
function parseId(res, value) {
    if (Array.isArray(value)) {
        res.status(400).json({
            message: "Invalid opportunity candidate id.",
        });
        return null;
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            message: "Invalid opportunity candidate id.",
        });
        return null;
    }
    return id;
}
function readCandidateInput(req, res, requireTitle) {
    const input = {};
    if (requireTitle || req.body.title !== undefined) {
        const title = (0, requestParsing_1.readRequiredString)(res, req.body.title, "title");
        if (!title)
            return null;
        input.title = title;
    }
    const scoutGoalId = (0, requestParsing_1.readOptionalInteger)(res, req.body.scoutGoalId, "scoutGoalId");
    if (res.headersSent)
        return null;
    if (scoutGoalId !== undefined)
        input.scoutGoalId = scoutGoalId;
    const score = (0, requestParsing_1.readOptionalInteger)(res, req.body.score, "score");
    if (res.headersSent)
        return null;
    if (score !== undefined)
        input.score = score;
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
        if (status !== null && !(0, opportunity_constants_1.isAllowedValue)(opportunity_constants_1.CANDIDATE_STATUSES, status)) {
            res.status(400).json({ message: "status is not allowed." });
            return null;
        }
        input.status = status;
    }
    const deadline = (0, requestParsing_1.readOptionalDate)(res, req.body.deadline, "deadline");
    if (res.headersSent)
        return null;
    if (deadline !== undefined)
        input.deadline = deadline;
    const optionalStringFields = [
        ["organization", "organization"],
        ["source", "source"],
        ["link", "link"],
        ["whyItMatters", "whyItMatters"],
        ["suggestedNextAction", "suggestedNextAction"],
    ];
    for (const [bodyKey, inputKey] of optionalStringFields) {
        const value = (0, requestParsing_1.readOptionalString)(req.body[bodyKey]);
        if (value !== undefined)
            input[inputKey] = value;
    }
    return input;
}
async function listCandidates(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const candidates = await (0, opportunityCandidate_service_1.listCandidatesForUser)(user.id);
        res.json(candidates);
    }
    catch (error) {
        next(error);
    }
}
async function addCandidate(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const input = readCandidateInput(req, res, true);
        if (!input)
            return;
        const candidate = await (0, opportunityCandidate_service_1.createCandidateForUser)(user.id, input);
        res.status(201).json(candidate);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Scout goal")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
}
async function getCandidate(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const candidate = await (0, opportunityCandidate_service_1.findCandidateForUser)(user.id, id);
        if (!candidate) {
            return res.status(404).json({ message: "Opportunity candidate not found." });
        }
        res.json(candidate);
    }
    catch (error) {
        next(error);
    }
}
async function updateCandidate(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const input = readCandidateInput(req, res, false);
        if (!input)
            return;
        const candidate = await (0, opportunityCandidate_service_1.updateCandidateForUser)(user.id, id, input);
        if (!candidate) {
            return res.status(404).json({ message: "Opportunity candidate not found." });
        }
        res.json(candidate);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("Scout goal")) {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
}
async function deleteCandidate(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const candidate = await (0, opportunityCandidate_service_1.deleteCandidateForUser)(user.id, id);
        if (!candidate) {
            return res.status(404).json({ message: "Opportunity candidate not found." });
        }
        res.json(candidate);
    }
    catch (error) {
        next(error);
    }
}
async function approveCandidate(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const result = await (0, opportunityCandidate_service_1.approveCandidateForUser)(user.id, id);
        if (!result) {
            return res.status(404).json({ message: "Opportunity candidate not found." });
        }
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
}
async function ignoreCandidate(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const candidate = await (0, opportunityCandidate_service_1.ignoreCandidateForUser)(user.id, id);
        if (!candidate) {
            return res.status(404).json({ message: "Opportunity candidate not found." });
        }
        res.json(candidate);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=opportunityCandidate.controller.js.map