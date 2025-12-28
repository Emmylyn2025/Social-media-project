import { asyncHandler, appError } from "../error-handling/error404.js";
import multer from "multer";
import fs from "fs";
import path from "path"
import upload from "../schema/uploadSchema.js";
import User from "../schema/userSchema.js";
import uploadToCloudinary from "../cloudinary/cloudinaryHelpers.js";

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dest = "posts";

    if(!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    cb(null, dest);
  },
  filename: function(req, file, cb) {

    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  }
});

const fileFilter = function(req, file, cb) {

  if(!file.mimetype.startsWith("image") || !file.mimetype.startsWith("video")) {

    cb(false, new Error("Only images and videos can be uploaded with posts"));
  } else {
    cb(null, "Allowed");
  }
}

export const upload2 = multer({
  storage,
  fileFilter,
  limits: 10 * 1024 * 1024 //Limit of 500mb
});

export const postController = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId);

  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  //Get file title from frontend
  const {fileContent} = req.body;

  let fileSecureUrl = null;
  let filePublicId = null;

  if(!fileContent) {
    return next(new appError("Post title is required", 400));
  }

  //Upload file url and public id to clodinary, if file is uploaded
    if(req.file){
      const uploadFile = await uploadToCloudinary(req.file.path);

      fileSecureUrl = uploadFile.fileSecureUrl;
      filePublicId = uploadFile.filePublicId
    }

    //Create new post
    const newPost = await upload.create({
      fileSecureUrl,
      filePublicId,
      fileTitle: fileContent,
      uploadedBy: user.userId
    })

  res.status(201).json({
    message: "New post created",
    newPost
  });
});

export const deletePost = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId);

  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  const postId = req.params.id;

  const post = await upload.findById(postId);
  
  if(!post) {
    return next(new appError("Post not found", 404));
  }

  if(post.uploadedBy.toString() !== user.userId) {
    return next(new appError("You cannot delete this post", 401));
  }

  const deletePost = await upload.findByIdAndDelete(postId);

  res.status(200).json({
    message: "Post deleted successfully",
    post: deletePost
  });
});

export const makeComment = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId);

  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  //Get post by id
  const postId = req.params.id;
  //Search for post
  const post = await upload.findById(postId);

  if(!post) {
    return next(new appError('Post not found', 400));
  }

  //Make comment
  const content = req.body.content;
  post.comments.push({user: user.userId, content: content});

  //New comment
  await post.save();

  res.status(201).json({
    message: "Comment made successfully",
    content
  });
});

export const deleteComment = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId);

  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  const {postId, commentId} = req.params;

  //Get the post
  const post = await upload.findById(postId);
  if(!post) {
    return next(new appError("Post not found", 404));
  }

  //Get the index of the comment
  const index = post.comments.findIndex((comm) => comm._id.toString() === commentId);

  if(post.comments[index].user.toString() !== user.userId) {
    return next(new appError("You cannot delete this comment", 401));
  }

  post.comments = post.comments.filter(comm => comm._id.toString() !== commentId);

  await post.save();

  res.status(200).json({
    message: "Comment deleted successfully"
  });
});

export const makeLike = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId);

  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  //Post Id dynamic routing
  const postId = req.params.id;
  const post = await upload.findById(postId);

  if(!post) {
    return next(new appError("post not found", 404));
  };

  //Check if the user has disliked before
  const checkDislike = post.dislike.find(person => person.user.toString() === user.userId);

  //If the person has disliked, remove from the dislike array
  if(checkDislike) {
    post.dislike = post.dislike.filter(person => person.user !== user.userId);
  } 

  //Check if user has like before
  const likeBefore = post.likes.find(person => person.user.toString() === user.userId);

  //If the user has liked before return an error
  if(likeBefore) {
    return next(new appError("You have liked this post before", 400));
  }
  
  post.likes.push({user: user.userId});

  await post.save();

  res.status(200).json({
    message: "You liked the post"
  });
});

export const makeDislike = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId);

  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  //Post Id dynamic routing
  const postId = req.params.id;
  const post = await upload.findById(postId);

  if(!post) {
    return next(new appError("post not found", 404));
  };

  //Remove from like array if the user has liked before
  const checkLike = post.likes.find(person => person.user.toString() === user.userId);
  //Remove the person id from the likes array
  if(checkLike) {
    post.likes = post.likes.filter(person => person.user.toString() !== user.userId);
  }

  //Check if the user has disliked the post before
  const dislikeBefore = post.dislike.find(person => person.user.toString() === user.userId);
  //If disliked before, respond with an error
  if(dislikeBefore) {
    return next(new appError("You have disliked this post before", 400))
  }

  post.dislike.push({user: user.userId});

  await post.save();

  res.status(200).json({
    message: "You disliked this post"
  });
});

export const viewPost = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId);

  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  //Get all post
  const allPost = await upload.find(req.query).populate("uploadedBy", "username").populate("comments.user", "username");

  if(!allPost) {
    return next(new appError('Post not found', 400));
  }

  res.status(200).json({
    message: "All post",
    allPost
  });
});