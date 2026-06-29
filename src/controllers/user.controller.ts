import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/firebaseAuth.middleware";
import {
  createUser,
  findUserByFirebaseUid,
  updateUserProfile,
} from "../models/user.model";

function splitDisplayName(displayName?: string) {
  const trimmedName = displayName?.trim();

  if (!trimmedName) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  const [firstName, ...remainingNames] = trimmedName.split(/\s+/);

  return {
    firstName,
    lastName: remainingNames.join(" ") || null,
  };
}

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const firebaseUser = req.firebaseUser;

    if (!firebaseUser) {
      return res.status(401).json({
        message: "Unauthorized. Firebase user not found.",
      });
    }

    let user = await findUserByFirebaseUid(firebaseUser.uid);

    if (!user) {
      const { firstName, lastName } = splitDisplayName(firebaseUser.name);

      user = await createUser({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || "",
        firstName,
        lastName,
        role: "user",
      });
    }

    res.json({
      message: "User profile loaded successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const firebaseUser = req.firebaseUser;

    if (!firebaseUser) {
      return res.status(401).json({
        message: "Unauthorized. Firebase user not found.",
      });
    }

    const { firstName, lastName } = req.body;

    if (
      firstName !== undefined &&
      firstName !== null &&
      typeof firstName !== "string"
    ) {
      return res.status(400).json({
        message: "firstName must be a string.",
      });
    }

    if (
      lastName !== undefined &&
      lastName !== null &&
      typeof lastName !== "string"
    ) {
      return res.status(400).json({
        message: "lastName must be a string.",
      });
    }

    const user = await updateUserProfile(firebaseUser.uid, {
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
    });

    if (!user) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    return res.json({
      message: "User profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
}
