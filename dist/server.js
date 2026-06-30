"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const initDatabase_1 = require("./config/initDatabase");
const opportunityCandidate_routes_1 = __importDefault(require("./modules/opportunity-candidates/opportunityCandidate.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const opportunity_routes_1 = __importDefault(require("./modules/opportunities/opportunity.routes"));
const scoutGoal_routes_1 = __importDefault(require("./modules/scout-goals/scoutGoal.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("GabrielOS backend is running");
});
app.get("/api/test-db", async (_req, res, next) => {
    try {
        const result = await db_1.default.query("SELECT NOW()");
        res.json(result.rows[0]);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/users", async (_req, res, next) => {
    try {
        const result = await db_1.default.query("SELECT * FROM users");
        res.json(result.rows);
    }
    catch (error) {
        next(error);
    }
});
app.use("/api/opportunities", opportunity_routes_1.default);
app.use("/api/opportunity-candidates", opportunityCandidate_routes_1.default);
app.use("/api/scout-goals", scoutGoal_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({
        message: "Something went wrong",
        error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
});
async function startServer() {
    try {
        await (0, initDatabase_1.initDatabase)();
        app.listen(PORT, () => {
            console.log(`GabrielOS backend running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start GabrielOS backend:", error);
        process.exit(1);
    }
}
void startServer();
exports.default = app;
//# sourceMappingURL=server.js.map