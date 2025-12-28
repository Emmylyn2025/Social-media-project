import express from "express";
import { registerUser, loginUser, allUsers, refreshToken } from "../controllers/userContoller.js";
import {postController, viewPost, makeComment, makeLike, makeDislike} from "../controllers/uploadController.js";
import { protect } from "../Middleware/protect.js";
import { upload } from "../multer/multer.js";
import { upload2 } from "../controllers/uploadController.js";
const router = express.Router();

//User routes
router.post('/register', upload.single('image'), registerUser);
router.post('/login', loginUser);
router.get('/allusers', protect , allUsers);
router.get('/refresh', refreshToken);

//Uploads routes
router.post('/upload', upload2.single('post'), protect, postController);
router.get('/allpost', protect, viewPost);
router.post('/comment/:id', protect, makeComment);
router.post('/like/:id', protect, makeLike);
router.post('/dislike/:id', protect, makeDislike);
export default router;