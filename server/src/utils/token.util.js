import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export const ACCESS_COOKIE_NAME = "accessToken";
export const REFRESH_COOKIE_NAME = "refreshToken";

export const signAccessToken = (account, options = {}) => {
  const rememberMe = Boolean(options.rememberMe);

  return jwt.sign({ sub: account.idAccount, role: account.role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

export const signRefreshToken = (account, options = {}) => {
  const rememberMe = Boolean(options.rememberMe);

  return jwt.sign({ sub: account.idAccount, type: "refresh" }, config.jwt.refreshSecret, {
    expiresIn: rememberMe ? config.jwt.refreshExpiresInRememberMe : config.jwt.refreshExpiresIn,
  });
};

export const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const getAccessCookieOptions = (rememberMe = false) => ({
  httpOnly: true,
  secure: config.cookies.secure,
  sameSite: config.cookies.sameSite,
  path: "/",
  maxAge: config.jwt.accessExpiresMs,
});

export const getRefreshCookieOptions = (rememberMe = false) => ({
  httpOnly: true,
  secure: config.cookies.secure,
  sameSite: config.cookies.sameSite,
  path: "/",
  maxAge: rememberMe ? config.jwt.refreshExpiresMsRememberMe : config.jwt.refreshExpiresMs,
});

export const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookies.secure,
  sameSite: config.cookies.sameSite,
  path: "/",
});

export const setAuthCookies = (res, tokens, options = {}) => {
  const rememberMe = Boolean(options.rememberMe);

  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, getAccessCookieOptions(rememberMe));
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getRefreshCookieOptions(rememberMe));
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, getClearCookieOptions());
  res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());
};
