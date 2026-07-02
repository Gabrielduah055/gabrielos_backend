import { Router } from "express";
import { firebaseAuth } from "../../middleware/firebaseAuth.middleware";
import { getHeadlines } from "./news.controller";

const router = Router();

router.use(firebaseAuth);

router.get("/", getHeadlines);

export default router;
