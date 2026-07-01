import { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "crypto";

/**
 * Lightweight shared-secret auth for server-to-server automation calls
 * (e.g. Hermes Agent cron jobs), completely separate from firebaseAuth.
 *
 * Firebase auth resolves the acting user dynamically from a per-request
 * user ID token. This middleware instead validates a static secret and
 * lets the caller resolve a fixed tenant via HERMES_SERVICE_USER_ID
 * (see src/utils/hermesServiceUser.ts) - appropriate for a personal,
 * single-user automation surface.
 */
export const serviceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const expected = process.env.SERVICE_API_KEY;

  if (!expected) {
    return res.status(500).json({
      message: "SERVICE_API_KEY is not configured on the server.",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized. No service credentials provided.",
    });
  }

  const token = authHeader.split(" ")[1] ?? "";

  const a = Buffer.from(token);
  const b = Buffer.from(expected);

  const isValid = a.length === b.length && timingSafeEqual(a, b);

  if (!isValid) {
    return res.status(401).json({
      message: "Unauthorized. Invalid service credentials.",
    });
  }

  next();
};
