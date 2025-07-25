import { createMessage, deleteMessage, getMessages } from "../controller/message_controller.js";

import express from "express";
import {isAdmin} from "../middleware/authMiddleware.js"
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/", createMessage);
router.get("/", verifyToken, isAdmin, getMessages);
router.delete("/:id", verifyToken, isAdmin, deleteMessage);

export default router;
