import { asyncHandler, appError } from "../error-handling/error404.js";
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const headers = req.headers.authorization
  
  //Regex
  const regex = /^Bearer/;
  if(!regex.test(headers)){
    return next(new appError("No token provided", 400))
  }

  //Extract token from headers
  const token = headers.split(" ")[1];
  // if(!token) {
  //   return next(new appError("No token provided", 401));
  // }

  const decoded = jwt.verify(
    token,
    process.env.access_Token
  );

  req.userInfo = decoded;
  next();
};