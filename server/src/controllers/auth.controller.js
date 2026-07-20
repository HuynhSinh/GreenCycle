import asyncHandler from "../utils/asyncHandler.js";
import { clearAuthCookies, REFRESH_COOKIE_NAME, setAuthCookies } from "../utils/token.util.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated.body, req);
  setAuthCookies(res, result.tokens, { rememberMe: Boolean(req.validated.body.rememberMe) });
  res.status(201).json({
    message: "Registered successfully",
    user: result.user,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated.body, req);
  setAuthCookies(res, result.tokens, { rememberMe: Boolean(req.validated.body.rememberMe) });
  res.json({
    message: "Logged in successfully",
    user: result.user,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ user });
});
