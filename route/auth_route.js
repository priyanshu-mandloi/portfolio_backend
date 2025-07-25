import {editProfile, login, logout, register} from '../controller/auth_controller.js';

import express from 'express';
import { upload } from '../middleware/upload.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router  = express.Router();

router.post("/register", upload.single("avatar"), register);
router.post('/login',login);
router.post('/logout',logout);
router.put('/edit', verifyToken, upload.single('avatar'), editProfile);
export default router;
