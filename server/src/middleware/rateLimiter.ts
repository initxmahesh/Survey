import rateLimit from "express-rate-limit";

export const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Rate limit exceeded." },
  standardHeaders: true,
  legacyHeaders: false,
});

