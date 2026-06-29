"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const opportunity_controller_1 = require("./opportunity.controller");
const router = (0, express_1.Router)();
router.get("/", opportunity_controller_1.listOpportunities);
router.post("/", opportunity_controller_1.addOpportunity);
exports.default = router;
//# sourceMappingURL=opportunity.routes.js.map