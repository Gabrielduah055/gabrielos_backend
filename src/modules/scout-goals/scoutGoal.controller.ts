import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/firebaseAuth.middleware";
import { getAuthenticatedUser } from "../../utils/authenticatedUser";
import {
  isAllowedValue,
  OPPORTUNITY_TYPES,
  SCOUT_GOAL_FREQUENCIES,
} from "../opportunities/opportunity.constants";
import {
  readOptionalBoolean,
  readOptionalInteger,
  readOptionalString,
  readOptionalTextOrJson,
  readRequiredString,
} from "../opportunities/requestParsing";
import {
  CreateScoutGoalInput,
  createScoutGoalForUser,
  deleteScoutGoalForUser,
  findScoutGoalForUser,
  listScoutGoalsForUser,
  UpdateScoutGoalInput,
  updateScoutGoalForUser,
} from "./scoutGoal.service";

function parseId(res: Response, value: unknown): number | null {
  if (Array.isArray(value)) {
    res.status(400).json({
      message: "Invalid scout goal id.",
    });
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({
      message: "Invalid scout goal id.",
    });
    return null;
  }

  return id;
}

function readScoutGoalInput(
  req: AuthRequest,
  res: Response,
  requireTitle: boolean
): Partial<CreateScoutGoalInput> | null {
  const input: Partial<CreateScoutGoalInput> = {};

  if (requireTitle || req.body.title !== undefined) {
    const title = readRequiredString(res, req.body.title, "title");
    if (!title) return null;
    input.title = title;
  }

  const type = readOptionalString(req.body.type);
  if (type !== undefined) {
    if (type !== null && !isAllowedValue(OPPORTUNITY_TYPES, type)) {
      res.status(400).json({ message: "type is not allowed." });
      return null;
    }
    input.type = type;
  }

  const frequency = readOptionalString(req.body.frequency);
  if (frequency !== undefined) {
    if (frequency !== null && !isAllowedValue(SCOUT_GOAL_FREQUENCIES, frequency)) {
      res.status(400).json({ message: "frequency is not allowed." });
      return null;
    }
    input.frequency = frequency;
  }

  const minimumScore = readOptionalInteger(res, req.body.minimumScore, "minimumScore");
  if (res.headersSent) return null;
  if (minimumScore !== undefined) input.minimumScore = minimumScore;

  const isActive = readOptionalBoolean(req.body.isActive);
  if (isActive !== undefined) input.isActive = isActive;

  const keywords = readOptionalString(req.body.keywords);
  if (keywords !== undefined) input.keywords = keywords;

  const location = readOptionalString(req.body.location);
  if (location !== undefined) input.location = location;

  const sources = readOptionalTextOrJson(req.body.sources);
  if (sources !== undefined) input.sources = sources;

  return input;
}

export async function listScoutGoals(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const scoutGoals = await listScoutGoalsForUser(user.id);
    res.json(scoutGoals);
  } catch (error) {
    next(error);
  }
}

export async function addScoutGoal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const input = readScoutGoalInput(req, res, true);
    if (!input) return;

    const scoutGoal = await createScoutGoalForUser(
      user.id,
      input as CreateScoutGoalInput
    );
    res.status(201).json(scoutGoal);
  } catch (error) {
    next(error);
  }
}

export async function getScoutGoal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const scoutGoal = await findScoutGoalForUser(user.id, id);

    if (!scoutGoal) {
      return res.status(404).json({ message: "Scout goal not found." });
    }

    res.json(scoutGoal);
  } catch (error) {
    next(error);
  }
}

export async function updateScoutGoal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const input = readScoutGoalInput(req, res, false);
    if (!input) return;

    const scoutGoal = await updateScoutGoalForUser(
      user.id,
      id,
      input as UpdateScoutGoalInput
    );

    if (!scoutGoal) {
      return res.status(404).json({ message: "Scout goal not found." });
    }

    res.json(scoutGoal);
  } catch (error) {
    next(error);
  }
}

export async function deleteScoutGoal(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const scoutGoal = await deleteScoutGoalForUser(user.id, id);

    if (!scoutGoal) {
      return res.status(404).json({ message: "Scout goal not found." });
    }

    res.json(scoutGoal);
  } catch (error) {
    next(error);
  }
}
