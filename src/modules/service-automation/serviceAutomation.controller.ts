import { NextFunction, Request, Response } from "express";
import {
  getHermesServiceUserId,
  ServiceConfigurationError,
} from "../../utils/hermesServiceUser";
import { listScoutGoalsForUser } from "../scout-goals/scoutGoal.service";
import { listCandidatesForUser } from "../opportunity-candidates/opportunityCandidate.service";
import { buildDailyBrief } from "../../services/dailyBrief.service";
import {
  runScoutGoal,
  ScoutGoalNotFoundError,
} from "../../services/scout.service";
import {
  TavilyConfigurationError,
  TavilySearchError,
} from "../../services/webSearch.service";

function resolveServiceUserId(res: Response): number | null {
  try {
    return getHermesServiceUserId();
  } catch (error) {
    if (error instanceof ServiceConfigurationError) {
      res.status(500).json({ message: error.message });
      return null;
    }
    throw error;
  }
}

function parseId(res: Response, value: unknown): number | null {
  if (Array.isArray(value)) {
    res.status(400).json({ message: "Invalid id." });
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ message: "Invalid id." });
    return null;
  }

  return id;
}

export async function listScoutGoalsForService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = resolveServiceUserId(res);
    if (!userId) return;

    const scoutGoals = await listScoutGoalsForUser(userId);
    res.json(scoutGoals);
  } catch (error) {
    next(error);
  }
}

export async function runScoutGoalForService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = resolveServiceUserId(res);
    if (!userId) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const summary = await runScoutGoal(userId, id);

    res.json({
      message: "Scout completed successfully.",
      ...summary,
    });
  } catch (error) {
    if (error instanceof ScoutGoalNotFoundError) {
      return res.status(404).json({ message: "Scout Goal not found." });
    }

    if (error instanceof TavilyConfigurationError) {
      return res.status(500).json({
        message: "Tavily API key is not configured.",
      });
    }

    if (error instanceof TavilySearchError) {
      return res.status(502).json({
        message: "Scout failed while searching the web.",
      });
    }

    next(error);
  }
}

export async function listPendingCandidatesForService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = resolveServiceUserId(res);
    if (!userId) return;

    const candidates = await listCandidatesForUser(userId);
    res.json(candidates.filter((candidate) => candidate.status === "pending"));
  } catch (error) {
    next(error);
  }
}

export async function getDailyBriefForService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = resolveServiceUserId(res);
    if (!userId) return;

    const brief = await buildDailyBrief(userId);

    res.json({
      ...brief,
      narrative: null,
      narrativeSource: null,
    });
  } catch (error) {
    next(error);
  }
}
