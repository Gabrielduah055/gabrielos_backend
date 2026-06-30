import { Router } from "express";
import { firebaseAuth } from "../../middleware/firebaseAuth.middleware";
import {
  addOpportunity,
  deleteOpportunity,
  getOpportunity,
  listOpportunities,
  updateOpportunity,
} from "./opportunity.controller";

const router = Router();

router.use(firebaseAuth);

router.get("/", listOpportunities);
router.post("/", addOpportunity);
router.get("/:id", getOpportunity);
router.patch("/:id", updateOpportunity);
router.delete("/:id", deleteOpportunity);

export default router;
