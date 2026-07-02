import { Router } from "express";
import { serviceAuth } from "../../middleware/serviceAuth.middleware";
import {
  getDailyBriefForService,
  listPendingCandidatesForService,
  listScoutGoalsForService,
  runDueScoutGoalsForService,
  runScoutGoalForService,
} from "./serviceAutomation.controller";

const router = Router();

router.use(serviceAuth);

router.get("/scout-goals", listScoutGoalsForService);
router.post("/scout-goals/run-due", runDueScoutGoalsForService);
router.post("/scout-goals/:id/run", runScoutGoalForService);
router.get("/opportunity-candidates", listPendingCandidatesForService);
router.get("/daily-brief", getDailyBriefForService);

export default router;
