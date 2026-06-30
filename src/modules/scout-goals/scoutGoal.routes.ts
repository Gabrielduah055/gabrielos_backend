import { Router } from "express";
import { firebaseAuth } from "../../middleware/firebaseAuth.middleware";
import {
  addScoutGoal,
  deleteScoutGoal,
  getScoutGoal,
  listScoutGoals,
  updateScoutGoal,
} from "./scoutGoal.controller";

const router = Router();

router.use(firebaseAuth);

router.get("/", listScoutGoals);
router.post("/", addScoutGoal);
router.get("/:id", getScoutGoal);
router.patch("/:id", updateScoutGoal);
router.delete("/:id", deleteScoutGoal);

export default router;
