"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAuth = void 0;
const firebase_1 = __importDefault(require("../config/firebase"));
const firebaseAuth = async (req, res, next) => {
    try {
        if (!firebase_1.default.apps.length) {
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
        const decodedToken = await firebase_1.default.auth().verifyIdToken(token);
        req.firebaseUser = decodedToken;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Unauthorized. Invalid or expired token.",
        });
    }
};
exports.firebaseAuth = firebaseAuth;
//# sourceMappingURL=firebaseAuth.middleware.js.map