"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listScoutGoals = listScoutGoals;
exports.addScoutGoal = addScoutGoal;
exports.getScoutGoal = getScoutGoal;
exports.updateScoutGoal = updateScoutGoal;
exports.deleteScoutGoal = deleteScoutGoal;
exports.runScoutGoalById = runScoutGoalById;
const scout_service_1 = require("../../services/scout.service");
const webSearch_service_1 = require("../../services/webSearch.service");
const authenticatedUser_1 = require("../../utils/authenticatedUser");
const opportunity_constants_1 = require("../opportunities/opportunity.constants");
const requestParsing_1 = require("../opportunities/requestParsing");
const scoutGoal_service_1 = require("./scoutGoal.service");
function parseId(res, value) {
    if (Array.isArray(value)) {
        res.status(400).json({
            message: "Invalid scout goal id.",
        });
        return null;
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({
            message: "Invalid scout goal id.",
        });
        return null;
    }
    return id;
}
function readScoutGoalInput(req, res, requireTitle) {
    const input = {};
    if (requireTitle || req.body.title !== undefined) {
        const title = (0, requestParsing_1.readRequiredString)(res, req.body.title, "title");
        if (!title)
            return null;
        input.title = title;
    }
    const type = (0, requestParsing_1.readOptionalString)(req.body.type);
    if (type !== undefined) {
        if (type !== null && !(0, opportunity_constants_1.isAllowedValue)(opportunity_constants_1.OPPORTUNITY_TYPES, type)) {
            res.status(400).json({ message: "type is not allowed." });
            return null;
        }
        input.type = type;
    }
    const frequency = (0, requestParsing_1.readOptionalString)(req.body.frequency);
    if (frequency !== undefined) {
        if (frequency !== null && !(0, opportunity_constants_1.isAllowedValue)(opportunity_constants_1.SCOUT_GOAL_FREQUENCIES, frequency)) {
            res.status(400).json({ message: "frequency is not allowed." });
            return null;
        }
        input.frequency = frequency;
    }
    const minimumScore = (0, requestParsing_1.readOptionalInteger)(res, req.body.minimumScore, "minimumScore");
    if (res.headersSent)
        return null;
    if (minimumScore !== undefined)
        input.minimumScore = minimumScore;
    const isActive = (0, requestParsing_1.readOptionalBoolean)(req.body.isActive);
    if (isActive !== undefined)
        input.isActive = isActive;
    const keywords = (0, requestParsing_1.readOptionalString)(req.body.keywords);
    if (keywords !== undefined)
        input.keywords = keywords;
    const location = (0, requestParsing_1.readOptionalString)(req.body.location);
    if (location !== undefined)
        input.location = location;
    const sources = (0, requestParsing_1.readOptionalTextOrJson)(req.body.sources);
    if (sources !== undefined)
        input.sources = sources;
    return input;
}
async function listScoutGoals(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const scoutGoals = await (0, scoutGoal_service_1.listScoutGoalsForUser)(user.id);
        res.json(scoutGoals);
    }
    catch (error) {
        next(error);
    }
}
async function addScoutGoal(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const input = readScoutGoalInput(req, res, true);
        if (!input)
            return;
        const scoutGoal = await (0, scoutGoal_service_1.createScoutGoalForUser)(user.id, input);
        res.status(201).json(scoutGoal);
    }
    catch (error) {
        next(error);
    }
}
async function getScoutGoal(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const scoutGoal = await (0, scoutGoal_service_1.findScoutGoalForUser)(user.id, id);
        if (!scoutGoal) {
            return res.status(404).json({ message: "Scout goal not found." });
        }
        res.json(scoutGoal);
    }
    catch (error) {
        next(error);
    }
}
async function updateScoutGoal(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const input = readScoutGoalInput(req, res, false);
        if (!input)
            return;
        const scoutGoal = await (0, scoutGoal_service_1.updateScoutGoalForUser)(user.id, id, input);
        if (!scoutGoal) {
            return res.status(404).json({ message: "Scout goal not found." });
        }
        res.json(scoutGoal);
    }
    catch (error) {
        next(error);
    }
}
async function deleteScoutGoal(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const scoutGoal = await (0, scoutGoal_service_1.deleteScoutGoalForUser)(user.id, id);
        if (!scoutGoal) {
            return res.status(404).json({ message: "Scout goal not found." });
        }
        res.json(scoutGoal);
    }
    catch (error) {
        next(error);
    }
}
async function runScoutGoalById(req, res, next) {
    try {
        const user = await (0, authenticatedUser_1.getAuthenticatedUser)(req, res);
        if (!user)
            return;
        const id = parseId(res, req.params.id);
        if (!id)
            return;
        const summary = await (0, scout_service_1.runScoutGoal)(user.id, id);
        res.json({
            message: "Scout completed successfully.",
            ...summary,
        });
    }
    catch (error) {
        if (error instanceof scout_service_1.ScoutGoalNotFoundError) {
            return res.status(404).json({
                message: "Scout Goal not found.",
            });
        }
        if (error instanceof webSearch_service_1.TavilyConfigurationError) {
            return res.status(500).json({
                message: "Tavily API key is not configured.",
            });
        }
        if (error instanceof webSearch_service_1.TavilySearchError) {
            return res.status(502).json({
                message: "Scout failed while searching the web.",
            });
        }
        next(error);
    }
}
//# sourceMappingURL=scoutGoal.controller.js.map