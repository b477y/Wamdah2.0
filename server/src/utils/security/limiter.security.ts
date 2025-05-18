import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  limit: parseInt(process.env.RATE_LIMIT),
  windowMs: parseInt(process.env.WINDOW_MS),
  message: { err: "Too many requests, please try again later." },
  legacyHeaders: false,
});

export default limiter;
