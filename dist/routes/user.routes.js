"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const firebaseAuth_middleware_1 = require("../middleware/firebaseAuth.middleware");
const router = (0, express_1.Router)();
router.get("/me", firebaseAuth_middleware_1.firebaseAuth, user_controller_1.getMe);
router.put("/me", firebaseAuth_middleware_1.firebaseAuth, user_controller_1.updateMe);
exports.default = router;
//# sourceMappingURL=user.routes.js.map