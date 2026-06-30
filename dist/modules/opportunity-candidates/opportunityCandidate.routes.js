"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebaseAuth_middleware_1 = require("../../middleware/firebaseAuth.middleware");
const opportunityCandidate_controller_1 = require("./opportunityCandidate.controller");
const router = (0, express_1.Router)();
router.use(firebaseAuth_middleware_1.firebaseAuth);
router.get("/", opportunityCandidate_controller_1.listCandidates);
router.post("/", opportunityCandidate_controller_1.addCandidate);
router.get("/:id", opportunityCandidate_controller_1.getCandidate);
router.patch("/:id", opportunityCandidate_controller_1.updateCandidate);
router.delete("/:id", opportunityCandidate_controller_1.deleteCandidate);
router.post("/:id/approve", opportunityCandidate_controller_1.approveCandidate);
router.post("/:id/ignore", opportunityCandidate_controller_1.ignoreCandidate);
exports.default = router;
//# sourceMappingURL=opportunityCandidate.routes.js.map