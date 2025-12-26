
import jwt from "jsonwebtoken";

export function generateToken(user) {
  //Access token
  const accessToken = jwt.sign({
    userId: user._id,
    profileImageUrl: user.profileImageUrl,
    username: user.username,
    mobile: user.mobile
  }, process.env.access_Token, {expiresIn: "30min"});

  //Refresh token
  const refreshToken = jwt.sign({
    userId: user._id,
    profileImageUrl: user.profileImageUrl,
    username: user.username,
    mobile: user.mobile
  }, process.env.refresh_Token, {expiresIn: "30d"});

  return {accessToken, refreshToken};
}

//save refresh token in cookie
export const saveRefreshToken = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/social/media/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000 //30days
  })
}