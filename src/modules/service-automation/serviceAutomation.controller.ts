import { NextFunction, Request, Response } from "express";
import {
  getHermesServiceUserId,
  ServiceConfigurationError,
} from "../../utils/hermesServiceUser";
import { listScoutGoalsForUser } from "../scout-goals/scoutGoal.service";
import { listCandidatesForUser } from "../opportunity-candidates/opportunityCandidate.service";
import { buildDailyBrief } from "../../services/dailyBrief.service";
import { generateDailyBriefNarrative } from "../../services/narrative.service";
import {
  runDueScoutGoalsForUser,
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

/**
 * Runs whichever active scout goals are currently due (per each goal's
 * frequency + last_run_at), rather than one specific goal by id. This is
 * the endpoint an unattended scheduler (e.g. a Hermes cron job) should
 * call periodically instead of the user having to click "Run" by hand.
 */
export async function runDueScoutGoalsForService(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = resolveServiceUserId(res);
    if (!userId) return;

    const summary = await runDueScoutGoalsForUser(userId);

    res.json({
      message:
        summary.goalsRun > 0
          ? "Due scout goals completed successfully."
          : "No scout goals were due to run.",
      ...summary,
    });
  } catch (error) {
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
    const { narrative, source } = await generateDailyBriefNarrative(brief);

    res.json({
      ...brief,
      narrative,
      narrativeSource: source,
    });
  } catch (error) {
    next(error);
  }
}
