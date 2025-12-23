import appError from "../error-handling/error404.js";
import User from "../schema/userSchema.js";
import uploadToCloudinary from "../cloudinary/cloudinaryHelpers.js";

export const registerUser = async(req, res, next) => {
  try{

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
      return next(new appError("The password is not strong enough"), 400);
    }

    const user = await User.findOne({email});

    //Check if user exists
    if(user) {
      return next(new appError("This is a registered user", 400));
    }

    //Upload profile images to cloudinary
    const {fileSecureUrl, filePublicId} = await uploadToCloudinary(req.file.path);

    //If user does not exist create a new user
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

  } catch(error) {
    next(error);
  }
}