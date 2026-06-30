import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import pool from "./config/db";
import { initDatabase } from "./config/initDatabase";
import candidateRoutes from "./modules/opportunity-candidates/opportunityCandidate.routes";
import authRoutes from "./routes/auth.routes";
import opportunityRoutes from "./modules/opportunities/opportunity.routes";
import scoutGoalRoutes from "./modules/scout-goals/scoutGoal.routes";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("GabrielOS backend is running");
});

app.get("/api/test-db", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.use("/api/opportunities", opportunityRoutes);
app.use("/api/opportunity-candidates", candidateRoutes);
app.use("/api/scout-goals", scoutGoalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: "Something went wrong",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`GabrielOS backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start GabrielOS backend:", error);
    process.exit(1);
  }
}

void startServer();

export default app;
