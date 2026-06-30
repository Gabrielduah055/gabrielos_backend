import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/firebaseAuth.middleware";
import { getAuthenticatedUser } from "../../utils/authenticatedUser";
import {
  CANDIDATE_STATUSES,
  isAllowedValue,
  OPPORTUNITY_TYPES,
} from "../opportunities/opportunity.constants";
import {
  readOptionalDate,
  readOptionalInteger,
  readOptionalString,
  readRequiredString,
} from "../opportunities/requestParsing";
import {
  approveCandidateForUser,
  CreateOpportunityCandidateInput,
  createCandidateForUser,
  deleteCandidateForUser,
  findCandidateForUser,
  ignoreCandidateForUser,
  listCandidatesForUser,
  UpdateOpportunityCandidateInput,
  updateCandidateForUser,
} from "./opportunityCandidate.service";

function parseId(res: Response, value: unknown): number | null {
  if (Array.isArray(value)) {
    res.status(400).json({
      message: "Invalid opportunity candidate id.",
    });
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({
      message: "Invalid opportunity candidate id.",
    });
    return null;
  }

  return id;
}

function readCandidateInput(
  req: AuthRequest,
  res: Response,
  requireTitle: boolean
): Partial<CreateOpportunityCandidateInput> | null {
  const input: Partial<CreateOpportunityCandidateInput> = {};

  if (requireTitle || req.body.title !== undefined) {
    const title = readRequiredString(res, req.body.title, "title");
    if (!title) return null;
    input.title = title;
  }

  const scoutGoalId = readOptionalInteger(res, req.body.scoutGoalId, "scoutGoalId");
  if (res.headersSent) return null;
  if (scoutGoalId !== undefined) input.scoutGoalId = scoutGoalId;

  const score = readOptionalInteger(res, req.body.score, "score");
  if (res.headersSent) return null;
  if (score !== undefined) input.score = score;

  const type = readOptionalString(req.body.type);
  if (type !== undefined) {
    if (type !== null && !isAllowedValue(OPPORTUNITY_TYPES, type)) {
      res.status(400).json({ message: "type is not allowed." });
      return null;
    }
    input.type = type;
  }

  const status = readOptionalString(req.body.status);
  if (status !== undefined) {
    if (status !== null && !isAllowedValue(CANDIDATE_STATUSES, status)) {
      res.status(400).json({ message: "status is not allowed." });
      return null;
    }
    input.status = status;
  }

  const deadline = readOptionalDate(res, req.body.deadline, "deadline");
  if (res.headersSent) return null;
  if (deadline !== undefined) input.deadline = deadline;

  const optionalStringFields = [
    ["organization", "organization"],
    ["source", "source"],
    ["link", "link"],
    ["whyItMatters", "whyItMatters"],
    ["suggestedNextAction", "suggestedNextAction"],
  ] as const;

  for (const [bodyKey, inputKey] of optionalStringFields) {
    const value = readOptionalString(req.body[bodyKey]);
    if (value !== undefined) input[inputKey] = value;
  }

  return input;
}

export async function listCandidates(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const candidates = await listCandidatesForUser(user.id);
    res.json(candidates);
  } catch (error) {
    next(error);
  }
}

export async function addCandidate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const input = readCandidateInput(req, res, true);
    if (!input) return;

    const candidate = await createCandidateForUser(
      user.id,
      input as CreateOpportunityCandidateInput
    );
    res.status(201).json(candidate);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Scout goal")) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
}

export async function getCandidate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const candidate = await findCandidateForUser(user.id, id);

    if (!candidate) {
      return res.status(404).json({ message: "Opportunity candidate not found." });
    }

    res.json(candidate);
  } catch (error) {
    next(error);
  }
}

export async function updateCandidate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const input = readCandidateInput(req, res, false);
    if (!input) return;

    const candidate = await updateCandidateForUser(
      user.id,
      id,
      input as UpdateOpportunityCandidateInput
    );

    if (!candidate) {
      return res.status(404).json({ message: "Opportunity candidate not found." });
    }

    res.json(candidate);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Scout goal")) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
}

export async function deleteCandidate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const candidate = await deleteCandidateForUser(user.id, id);

    if (!candidate) {
      return res.status(404).json({ message: "Opportunity candidate not found." });
    }

    res.json(candidate);
  } catch (error) {
    next(error);
  }
}

export async function approveCandidate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const result = await approveCandidateForUser(user.id, id);

    if (!result) {
      return res.status(404).json({ message: "Opportunity candidate not found." });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function ignoreCandidate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const candidate = await ignoreCandidateForUser(user.id, id);

    if (!candidate) {
      return res.status(404).json({ message: "Opportunity candidate not found." });
    }

    res.json(candidate);
  } catch (error) {
    next(error);
  }
}
