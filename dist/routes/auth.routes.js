"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const firebaseAuth_middleware_1 = require("../middleware/firebaseAuth.middleware");
const router = (0, express_1.Router)();
router.post("/login", auth_controller_1.login);
router.post("/logout", firebaseAuth_middleware_1.firebaseAuth, auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map