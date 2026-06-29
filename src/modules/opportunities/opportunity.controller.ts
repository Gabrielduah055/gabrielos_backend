import { NextFunction, Request, Response } from "express";
import {
  createOpportunity,
  getAllOpportunities,
} from "./opportunity.service";

export async function listOpportunities(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const opportunities = await getAllOpportunities();
    res.json(opportunities);
  } catch (error) {
    next(error);
  }
}

export async function addOpportunity(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      title,
      source,
      type,
      description,
      link,
      score,
      reason,
      next_action,
      status,
    } = req.body;

    if (
      typeof title !== "string" ||
      title.trim() === "" ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return res.status(400).json({
        message: "title and description are required",
      });
    }

    const parsedScore =
      score === undefined || score === null || score === "" ? null : Number(score);

    if (parsedScore !== null && Number.isNaN(parsedScore)) {
      return res.status(400).json({
        message: "score must be a number",
      });
    }

    const opportunity = await createOpportunity({
      title: title.trim(),
      source,
      type,
      description: description.trim(),
      link,
      score: parsedScore,
      reason,
      next_action,
      status,
    });

    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
}
