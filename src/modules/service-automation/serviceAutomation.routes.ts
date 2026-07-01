import { Router } from "express";
import { serviceAuth } from "../../middleware/serviceAuth.middleware";
import {
  listPendingCandidatesForService,
  listScoutGoalsForService,
  runScoutGoalForService,
} from "./serviceAutomation.controller";

const router = Router();

router.use(serviceAuth);

router.get("/scout-goals", listScoutGoalsForService);
router.post("/scout-goals/:id/run", runScoutGoalForService);
router.get("/opportunity-candidates", listPendingCandidatesForService);

export default router;
