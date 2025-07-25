import {
  commentOnBlog,
  createBlog,
  deleteBlog,
  deleteComment,
  getAllBlogs,
  getBlogById,
  likeBlog,
  updateBlog,
} from '../controller/blog_controller.js';

import express from 'express';
import { isAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';
import {verifyToken} from '../middleware/verifyToken.js'

const router = express.Router();

// Admin create
router.post('/create', verifyToken, isAdmin, upload.single('image'), createBlog);

// Public list
router.get('/', getAllBlogs);

// Public single (will internally enforce privacy in controller)
router.get('/:id', getBlogById);

// Admin update/delete
// router.put('/:id', verifyToken, isAdmin, updateBlog);
router.put('/:id', verifyToken, isAdmin, upload.single('image'), updateBlog);

router.delete('/:id', verifyToken, isAdmin, deleteBlog);

// Like/comment require auth (any user)
router.post('/:id/like', verifyToken, likeBlog);
router.post('/:id/comment', verifyToken, commentOnBlog);
router.delete('/:id/comment/:commentId', verifyToken, deleteComment);
export default router;
