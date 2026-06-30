import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/firebaseAuth.middleware";
import { getAuthenticatedUser } from "../../utils/authenticatedUser";
import {
  isAllowedValue,
  OPPORTUNITY_PRIORITIES,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
} from "./opportunity.constants";
import {
  CreateOpportunityInput,
  createOpportunityForUser,
  deleteOpportunityForUser,
  findOpportunityForUser,
  listOpportunitiesForUser,
  UpdateOpportunityInput,
  updateOpportunityForUser,
} from "./opportunity.service";
import {
  readOptionalDate,
  readOptionalInteger,
  readOptionalString,
  readRequiredString,
} from "./requestParsing";

function parseId(res: Response, value: unknown): number | null {
  if (Array.isArray(value)) {
    res.status(400).json({
      message: "Invalid opportunity id.",
    });
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({
      message: "Invalid opportunity id.",
    });
    return null;
  }

  return id;
}

function readOpportunityInput(
  req: AuthRequest,
  res: Response,
  requireTitle: boolean
): Partial<CreateOpportunityInput> | null {
  const input: Partial<CreateOpportunityInput> = {};

  if (requireTitle || req.body.title !== undefined) {
    const title = readRequiredString(res, req.body.title, "title");
    if (!title) return null;
    input.title = title;
  }

  const candidateId = readOptionalInteger(res, req.body.candidateId, "candidateId");
  if (res.headersSent) return null;
  if (candidateId !== undefined) input.candidateId = candidateId;

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
    if (status !== null && !isAllowedValue(OPPORTUNITY_STATUSES, status)) {
      res.status(400).json({ message: "status is not allowed." });
      return null;
    }
    input.status = status;
  }

  const priority = readOptionalString(req.body.priority);
  if (priority !== undefined) {
    if (priority !== null && !isAllowedValue(OPPORTUNITY_PRIORITIES, priority)) {
      res.status(400).json({ message: "priority is not allowed." });
      return null;
    }
    input.priority = priority;
  }

  const deadline = readOptionalDate(res, req.body.deadline, "deadline");
  if (res.headersSent) return null;
  if (deadline !== undefined) input.deadline = deadline;

  const optionalStringFields = [
    ["organization", "organization"],
    ["source", "source"],
    ["nextAction", "nextAction"],
    ["link", "link"],
    ["notes", "notes"],
  ] as const;

  for (const [bodyKey, inputKey] of optionalStringFields) {
    const value = readOptionalString(req.body[bodyKey]);
    if (value !== undefined) input[inputKey] = value;
  }

  return input;
}

export async function listOpportunities(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const opportunities = await listOpportunitiesForUser(user.id);
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
}

export async function addOpportunity(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const input = readOpportunityInput(req, res, true);
    if (!input) return;

    const opportunity = await createOpportunityForUser(
      user.id,
      input as CreateOpportunityInput
    );
    res.status(201).json(opportunity);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Candidate")) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
}

export async function getOpportunity(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const opportunity = await findOpportunityForUser(user.id, id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found." });
    }

    res.json(opportunity);
  } catch (error) {
    next(error);
  }
}

export async function updateOpportunity(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const input = readOpportunityInput(req, res, false);
    if (!input) return;

    const opportunity = await updateOpportunityForUser(
      user.id,
      id,
      input as UpdateOpportunityInput
    );

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found." });
    }

    res.json(opportunity);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Candidate")) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
}

export async function deleteOpportunity(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const id = parseId(res, req.params.id);
    if (!id) return;

    const opportunity = await deleteOpportunityForUser(user.id, id);

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found." });
    }

    res.json(opportunity);
  } catch (error) {
    next(error);
  }
}
