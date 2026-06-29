"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.updateMe = updateMe;
const user_model_1 = require("../models/user.model");
function splitDisplayName(displayName) {
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
async function getMe(req, res, next) {
    try {
        const firebaseUser = req.firebaseUser;
        if (!firebaseUser) {
            return res.status(401).json({
                message: "Unauthorized. Firebase user not found.",
            });
        }
        let user = await (0, user_model_1.findUserByFirebaseUid)(firebaseUser.uid);
        if (!user) {
            const { firstName, lastName } = splitDisplayName(firebaseUser.name);
            user = await (0, user_model_1.createUser)({
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
    }
    catch (error) {
        next(error);
    }
}
async function updateMe(req, res, next) {
    try {
        const firebaseUser = req.firebaseUser;
        if (!firebaseUser) {
            return res.status(401).json({
                message: "Unauthorized. Firebase user not found.",
            });
        }
        const { firstName, lastName } = req.body;
        if (firstName !== undefined &&
            firstName !== null &&
            typeof firstName !== "string") {
            return res.status(400).json({
                message: "firstName must be a string.",
            });
        }
        if (lastName !== undefined &&
            lastName !== null &&
            typeof lastName !== "string") {
            return res.status(400).json({
                message: "lastName must be a string.",
            });
        }
        const user = await (0, user_model_1.updateUserProfile)(firebaseUser.uid, {
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
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=user.controller.js.map