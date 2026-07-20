import AppError from "../utils/AppError.js";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "../utils/token.util.js";

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];

  if (!token) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
};
