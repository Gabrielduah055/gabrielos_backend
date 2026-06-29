"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
async function readSchemaFile() {
    const schemaPaths = [
        path_1.default.join(process.cwd(), "src", "database", "schema.sql"),
        path_1.default.join(process.cwd(), "dist", "database", "schema.sql"),
        path_1.default.join(__dirname, "..", "database", "schema.sql"),
    ];
    for (const schemaPath of schemaPaths) {
        try {
            return await promises_1.default.readFile(schemaPath, "utf8");
        }
        catch (error) {
            const code = error.code;
            if (code !== "ENOENT") {
                throw error;
            }
        }
    }
    throw new Error("Database schema file was not found.");
}
async function initDatabase() {
    const schema = await readSchemaFile();
    await db_1.default.query(schema);
}
//# sourceMappingURL=initDatabase.js.map