import { Response } from "express";

export function readOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function readRequiredString(
  res: Response,
  value: unknown,
  fieldName: string
): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    res.status(400).json({
      message: `${fieldName} is required.`,
    });
    return null;
  }

  return value.trim();
}

export function readOptionalNumber(
  res: Response,
  value: unknown,
  fieldName: string
): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    res.status(400).json({
      message: `${fieldName} must be a number.`,
    });
    return undefined;
  }

  return parsed;
}

export function readOptionalInteger(
  res: Response,
  value: unknown,
  fieldName: string
): number | null | undefined {
  const parsed = readOptionalNumber(res, value, fieldName);

  if (parsed === undefined || parsed === null) {
    return parsed;
  }

  if (!Number.isInteger(parsed)) {
    res.status(400).json({
      message: `${fieldName} must be an integer.`,
    });
    return undefined;
  }

  return parsed;
}

export function readOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function readOptionalDate(
  res: Response,
  value: unknown,
  fieldName: string
): string | null | undefined {
  const parsed = readOptionalString(value);

  if (parsed === undefined || parsed === null) {
    return parsed;
  }

  if (Number.isNaN(Date.parse(parsed))) {
    res.status(400).json({
      message: `${fieldName} must be a valid date.`,
    });
    return undefined;
  }

  return parsed;
}

export function readOptionalTextOrJson(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return JSON.stringify(value);
}
