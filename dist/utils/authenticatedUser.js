"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticatedUser = getAuthenticatedUser;
const user_model_1 = require("../models/user.model");
async function getAuthenticatedUser(req, res) {
    const firebaseUser = req.firebaseUser;
    if (!firebaseUser) {
        res.status(401).json({
            message: "Unauthorized. Firebase user not found.",
        });
        return null;
    }
    const user = await (0, user_model_1.findUserByFirebaseUid)(firebaseUser.uid);
    if (!user) {
        res.status(404).json({
            message: "Logged-in PostgreSQL user was not found.",
        });
        return null;
    }
    return user;
}
//# sourceMappingURL=authenticatedUser.js.map