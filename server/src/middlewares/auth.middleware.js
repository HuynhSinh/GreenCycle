import AppError from "../utils/AppError.js";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, setAccessCookie, verifyAccessToken } from "../utils/token.util.js";
import * as authService from "../services/auth.service.js";

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];

  try {
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  } catch {
    try {
      const refreshed = await authService.refreshAccess(req.cookies?.[REFRESH_COOKIE_NAME]);
      req.user = refreshed.user;
      setAccessCookie(res, refreshed.accessToken);
      return next();
    } catch {
      return next(new AppError("Unauthorized", 401));
    }
  }
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError("Forbidden", 403));
  }

  next();
};
