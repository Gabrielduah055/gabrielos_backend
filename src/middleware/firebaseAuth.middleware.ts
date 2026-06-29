import { Request, Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import admin from "../config/firebase";

export interface AuthRequest extends Request {
  firebaseUser?: DecodedIdToken;
}

export const firebaseAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!admin.apps.length) {
      return res.status(500).json({
        message: "Firebase Admin SDK is not configured.",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized. No token provided.",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized. Invalid or expired token.",
    });
  }
};
