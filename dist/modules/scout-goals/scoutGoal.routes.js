"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebaseAuth_middleware_1 = require("../../middleware/firebaseAuth.middleware");
const scoutGoal_controller_1 = require("./scoutGoal.controller");
const router = (0, express_1.Router)();
router.use(firebaseAuth_middleware_1.firebaseAuth);
router.get("/", scoutGoal_controller_1.listScoutGoals);
router.post("/", scoutGoal_controller_1.addScoutGoal);
router.get("/:id", scoutGoal_controller_1.getScoutGoal);
router.patch("/:id", scoutGoal_controller_1.updateScoutGoal);
router.delete("/:id", scoutGoal_controller_1.deleteScoutGoal);
exports.default = router;
//# sourceMappingURL=scoutGoal.routes.js.map