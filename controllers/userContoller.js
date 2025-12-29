import { generateToken,  saveRefreshToken} from "../token/token.js";
import User from "../schema/userSchema.js";
import uploadToCloudinary from "../cloudinary/cloudinaryHelpers.js";
import { asyncHandler, appError } from "../error-handling/error404.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

export const registerUser = asyncHandler(async (req, res, next) => {
  let {username, email, mobile, password} = req.body;

    //Check if username is present
    if(!username) {
      return next(new appError("Username field required", 400));
    }

    //Check if mobile is present
    if(!mobile) {
      return next(new appError("Your mobile number is required", 400));
    }

    //Check of email is present
    if(!email) {
      return next(new appError("email field required", 400));
    }

    //Check is password is present
    if(!password) {
      return next(new appError("Password is required", 400));
    }

    //Check if the email is valid
    //Regular expression
    const regularExpress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!regularExpress.test(email)){
      return next(new appError("The email is not a valid email", 400));
    }

    //Check if phone number is valid
    //Regular expression
    const regex2 = /^(?:\+234|0)[789][10]\d{8}$/;
    if(!regex2.test(mobile)) {
      return next(new appError("The moblie is not valid", 400));
    }

    //If mobile starts with 0 replace with +234
    if(/^0/.test(mobile)) {
      mobile = mobile.replace(/^0/, "+234");
    }

    //Validate for strong password
    //Regular Expression
    const regex3 = /^[^\s]+[^A-Za-z0-9\s]{1,3}[\d]+$/;  //Password must have an alphanumeric beginning, maximum of three special characters at the middle and one or more numbers at the end.
    if(!regex3.test(password)) {
      return next(new appError("The password must have one special cahracter at the middle and numbers at the end"), 400);
    }

    const user = await User.findOne({email});

    //Check if user exists
    if(user) {
      return next(new appError("This is a registered user", 400));
    }

    let filePublicId = null;
    let fileSecureUrl = null;

    //Upload profile images to cloudinary if image is uploaded
    if(req.file) {
      const upload = await uploadToCloudinary(req.file.path);

      filePublicId = upload.filePublicId;
      fileSecureUrl = upload.fileSecureUrl
    } 
      
      //Create new user
      const newUser = await User.create({
        profileImageUrl: fileSecureUrl,
        profileImagePublicId: filePublicId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        mobile: Number(mobile),
        password: password.trim()
      });


    res.status(201).json({
      message: 'User registered successfully',
      newUser
    });
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const {username, password} = req.body;

  //Check if user exists
  const user = await User.findOne({username}).select("+password");
  if(!user) {
    return next(new appError("The username is not incorrect", 401));
  }

  //Check if password is correct
  const check = await user.correctPassword(password, user.password);
  if(!check) {
    return next(new appError("The password is not correct", 401));
  }

  //Generate tokens if password/username is correct
  const {accessToken, refreshToken} = generateToken(user);

  //Save refresh token in a cookie
  saveRefreshToken(res, refreshToken);

  res.status(200).json({
    message: "Login Successful",
    accessToken
  })
});

export const refreshToken = asyncHandler(async(req, res, next) => {
  const token = req.cookies.refreshToken;
  
  if(!token) {
    return next(new appError("No refresh token provided", 400));
  }

  //Decode refresh token
  jwt.verify(token, process.env.refresh_Token, (err, decoded) => {
    if(err) {
      return next(new appError("Invalid refresh token provided", 403))
    }

    //Generate new access token
    const {accessToken, refreshToken} = generateToken(decoded);

    //Save refresh token in cookie
    saveRefreshToken(res, refreshToken);

    res.status(200).json(accessToken);
  })
});

export const logOut = asyncHandler(async(req, res, next) => {
  
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/social/media/refresh"
  });

  res.status(200).json({
    message: "Logout Successful"
  });
});

export const allUsers = asyncHandler(async(req, res, next) => {
  //Get current user details
  const user = req.userInfo;
  //Check if it is a registered user
  const checkUser = await User.findById(user.userId);
  if(!checkUser){
    return next(new appError("This is not a registered user", 401));
  }

  //Get all users
  const allUser = await User.find();

  res.status(200).json({
    allUser
  })
});

export const changePassword = asyncHandler(async(req, res, next) => {
  const user = req.userInfo;
  //Check if user exists
  const userCheck = await User.findById(user.userId).select("+password");
  
  if(!userCheck) {
    return next(new appError('This is not a registered user', 401));
  }

  const {password, newPassword} = req.body;

  //Check if the old password is correct
  const check = await userCheck.correctPassword(password, userCheck.password);
  if(!check) {
    return next(new appError("The password is not correct", 401));
  }

  //Make the user password be equal to the new password
  userCheck.password = newPassword;

  await userCheck.save();

  res.status(200).json({
    message: "Password changed successfully"
  });
});

export const forgotPassword = asyncHandler(async(req, res, next) => {
  const {email} = req.body;

  //Check if email exists
  const user = await User.findOne({email});

  if(!user) {
    return next(new appError('User not found', 404));
  }

  //Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  //Hash crypto before sving to database
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000 //10min

  await user.save();

  const resetUrl = `http://localhost:3000/social/media/reset-password/${resetToken}`;

  const message = `You forgot you password click the link below to reset your password: \n ${resetUrl}`;

  await sendEmail({
    email: user.email,
    subject: "Reset Password",
    message
  });

  res.status(200).json({
    msg: "Reset password link has been sent to your email"
  });
});

export const resetPassword = asyncHandler(async(req, res, next) => {
  const {token} = req.params;
  const {password} = req.body;

  //Using regular expression to validate for strong password
  const regex = /^[^\s]+[^A-Za-z0-9\s]{1,3}[\d]+$/;
  if(!regex.test(password)) {
    return next(new appError("The password must have one special cahracter at the middle and numbers at the end"), 400);
  }
  //Hash token from the url
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if(!user) {
    return next(new appError("Token is invalid or has expired", 401))
  }

  user.password = password;

  user.passwordResetToken = null;
  user.passwordResetExpires = null;

  await user.save();
  res.status(200).json({
    message: "Password reset successfully"
  });
});