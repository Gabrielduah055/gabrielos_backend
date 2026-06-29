"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }
        const apiKey = process.env.FIREBASE_WEB_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                message: "Firebase Web API key is not configured.",
            });
        }
        const firebaseResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true,
            }),
        });
        const data = (await firebaseResponse.json());
        if (!firebaseResponse.ok) {
            return res.status(401).json({
                message: "Invalid email or password.",
                firebaseError: "error" in data ? data.error?.message : undefined,
            });
        }
        const signInData = data;
        return res.json({
            message: "Signed in successfully.",
            idToken: signInData.idToken,
            refreshToken: signInData.refreshToken,
            expiresIn: signInData.expiresIn,
            user: {
                firebaseUid: signInData.localId,
                email: signInData.email,
                fullName: signInData.displayName || "",
            },
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.controller.js.map