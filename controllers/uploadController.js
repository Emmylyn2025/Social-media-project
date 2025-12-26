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

  if(!fileContent) {
    return next(new appError("Post title is required", 400));
  }

  //Upload file url and public id to clodinary, if file is uploaded
  const {fileSecureUrl, filePublicId} = await uploadToCloudinary(req.file.path);
  
  //Save to database
  const newPost = await upload.create({
    fileSecureUrl,
    filePublicId,
    fileTitle: fileContent,
    uploadedBy: user.userId
  });

  res.status(201).json({
    message: "New post created",
    newPost
  });
})