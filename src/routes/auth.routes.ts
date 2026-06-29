import { Router } from "express";
import { login, logout } from "../controllers/auth.controller";
import { firebaseAuth } from "../middleware/firebaseAuth.middleware";

const router = Router();

router.post("/login", login);
router.post("/logout", firebaseAuth, logout);

export default router;
