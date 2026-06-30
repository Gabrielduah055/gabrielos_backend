import { Response } from "express";
import { AuthRequest } from "../middleware/firebaseAuth.middleware";
import { findUserByFirebaseUid, User } from "../models/user.model";

export async function getAuthenticatedUser(
  req: AuthRequest,
  res: Response
): Promise<User | null> {
  const firebaseUser = req.firebaseUser;

  if (!firebaseUser) {
    res.status(401).json({
      message: "Unauthorized. Firebase user not found.",
    });
    return null;
  }

  const user = await findUserByFirebaseUid(firebaseUser.uid);

  if (!user) {
    res.status(404).json({
      message: "Logged-in PostgreSQL user was not found.",
    });
    return null;
  }

  return user;
}
