"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebaseAuth_middleware_1 = require("../../middleware/firebaseAuth.middleware");
const opportunity_controller_1 = require("./opportunity.controller");
const router = (0, express_1.Router)();
router.use(firebaseAuth_middleware_1.firebaseAuth);
router.get("/", opportunity_controller_1.listOpportunities);
router.post("/", opportunity_controller_1.addOpportunity);
router.get("/:id", opportunity_controller_1.getOpportunity);
router.patch("/:id", opportunity_controller_1.updateOpportunity);
router.delete("/:id", opportunity_controller_1.deleteOpportunity);
exports.default = router;
//# sourceMappingURL=opportunity.routes.js.map