import express from "express";
import { registerUser, loginUser, allUsers, refreshToken, changePassword, forgotPassword, resetPassword } from "../controllers/userContoller.js";
import {postController, viewPost, makeComment, makeLike, makeDislike, deletePost, deleteComment} from "../controllers/uploadController.js";
import { protect } from "../Middleware/protect.js";
import { upload } from "../multer/multer.js";
import { upload2 } from "../controllers/uploadController.js";
import rateLimiter from "../rate-limit/rateLimiting.js";
const router = express.Router();

//User routes
router.post('/register', upload.single('image'), registerUser);
router.post('/login', rateLimiter(10, 10 * 60 * 1000), loginUser);
router.get('/allusers', protect , allUsers);
router.get('/refresh', refreshToken);
router.post('/changepassword', protect, changePassword);
router.post('/forgot', rateLimiter(5, 15 * 60 * 1000), forgotPassword);
router.post('/reset-password/:token', resetPassword );

//Uploads routes
router.post('/upload', upload2.single('post'), protect, postController);
router.get('/allpost', protect, viewPost);
router.post('/comment/:id', protect, makeComment);
router.post('/like/:id', protect, makeLike);
router.post('/dislike/:id', protect, makeDislike);
router.delete('/delete/:id', protect, deletePost);
router.delete('/deletecomment/:postId/:commentId', protect, deleteComment);
export default router;