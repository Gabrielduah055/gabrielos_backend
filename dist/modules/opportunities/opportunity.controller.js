"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOpportunities = listOpportunities;
exports.addOpportunity = addOpportunity;
const opportunity_service_1 = require("./opportunity.service");
async function listOpportunities(_req, res, next) {
    try {
        const opportunities = await (0, opportunity_service_1.getAllOpportunities)();
        res.json(opportunities);
    }
    catch (error) {
        next(error);
    }
}
async function addOpportunity(req, res, next) {
    try {
        const { title, source, type, description, link, score, reason, next_action, status, } = req.body;
        if (typeof title !== "string" ||
            title.trim() === "" ||
            typeof description !== "string" ||
            description.trim() === "") {
            return res.status(400).json({
                message: "title and description are required",
            });
        }
        const parsedScore = score === undefined || score === null || score === "" ? null : Number(score);
        if (parsedScore !== null && Number.isNaN(parsedScore)) {
            return res.status(400).json({
                message: "score must be a number",
            });
        }
        const opportunity = await (0, opportunity_service_1.createOpportunity)({
            title: title.trim(),
            source,
            type,
            description: description.trim(),
            link,
            score: parsedScore,
            reason,
            next_action,
            status,
        });
        res.status(201).json(opportunity);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=opportunity.controller.js.map