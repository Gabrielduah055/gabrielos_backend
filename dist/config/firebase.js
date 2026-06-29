"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
dotenv_1.default.config();
if (!(0, app_1.getApps)().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(serviceAccount),
    });
}
const admin = {
    auth: auth_1.getAuth,
    get apps() {
        return (0, app_1.getApps)();
    },
};
exports.default = admin;
//# sourceMappingURL=firebase.js.map