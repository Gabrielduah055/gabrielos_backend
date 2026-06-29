import dotenv from "dotenv";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT as string
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const admin = {
  auth: getAuth,
  get apps() {
    return getApps();
  },
};

export default admin;
