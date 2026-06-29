import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.controller";
import { firebaseAuth } from "../middleware/firebaseAuth.middleware";

const router = Router();

router.get("/me", firebaseAuth, getMe);
router.put("/me", firebaseAuth, updateMe);

export default router;
