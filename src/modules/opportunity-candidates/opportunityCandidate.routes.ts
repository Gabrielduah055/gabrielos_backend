import { Router } from "express";
import { firebaseAuth } from "../../middleware/firebaseAuth.middleware";
import {
  addCandidate,
  approveCandidate,
  deleteCandidate,
  getCandidate,
  ignoreCandidate,
  listCandidates,
  updateCandidate,
} from "./opportunityCandidate.controller";

const router = Router();

router.use(firebaseAuth);

router.get("/", listCandidates);
router.post("/", addCandidate);
router.get("/:id", getCandidate);
router.patch("/:id", updateCandidate);
router.delete("/:id", deleteCandidate);
router.post("/:id/approve", approveCandidate);
router.post("/:id/ignore", ignoreCandidate);

export default router;
