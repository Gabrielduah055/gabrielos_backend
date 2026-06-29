import { Router } from "express";
import { addOpportunity, listOpportunities } from "./opportunity.controller";

const router = Router();

router.get("/", listOpportunities);
router.post("/", addOpportunity);

export default router;
