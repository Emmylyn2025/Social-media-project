import rateLimit from "express-rate-limit";

const rateLimiter = (maxRequests, time) => {
  return rateLimit({
    max: maxRequests,
    windowMs: time,
    message: "To many attempts, try in next 10 minutes",
    standardHeaders: true,
    legacyHeaders: true
  });
}

export default rateLimiter;