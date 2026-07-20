import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";
import { config } from "../config/index.js";
import {
  createAccount,
  createRefreshToken,
  deleteExpiredRefreshTokensForAccount,
  deleteRefreshTokenByHash,
  findAccountByEmail,
  findAccountById,
  findAccountByUsername,
} from "../repositories/auth.repository.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token.util.js";
import { toPublicAccount } from "../utils/account.presenter.js";

const buildTokenPair = async (account, req, options = {}) => {
  const rememberMe = Boolean(options.rememberMe);
  const accessToken = signAccessToken(account, { rememberMe });
  const refreshToken = signRefreshToken(account, { rememberMe });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + (rememberMe ? config.jwt.refreshExpiresMsRememberMe : config.jwt.refreshExpiresMs),
  );

  await deleteExpiredRefreshTokensForAccount(account.idAccount);
  await createRefreshToken({
    tokenHash,
    idAccount: account.idAccount,
    userAgent: req.get("user-agent") || null,
    ipAddress: req.ip || null,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const register = async (payload, req) => {
  const username = payload.username.trim();
  const email = payload.email.trim().toLowerCase();

  const [existingUsername, existingEmail] = await Promise.all([
    findAccountByUsername(username),
    findAccountByEmail(email),
  ]);

  if (existingUsername || existingEmail) {
    throw new AppError("Unable to register with provided credentials", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, config.bcrypt.saltRounds);
  const account = await createAccount({
    username,
    email,
    password: passwordHash,
    role: "CUSTOMER",
  });
  const tokens = await buildTokenPair(account, req, { rememberMe: Boolean(payload.rememberMe) });

  return {
    user: toPublicAccount(account),
    tokens,
  };
};

export const login = async (payload, req) => {
  const email = payload.email.trim().toLowerCase();

  const account = await findAccountByEmail(email);

  const isValidPassword = account
    ? await bcrypt.compare(payload.password, account.password)
    : false;

  if (!account || !isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  const tokens = await buildTokenPair(account, req, { rememberMe: Boolean(payload.rememberMe) });

  return {
    user: toPublicAccount(account),
    tokens,
  };
};

export const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  try {
    verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  await deleteRefreshTokenByHash(hashToken(refreshToken));
};

export const getMe = async (accountId) => {
  const account = await findAccountById(accountId);

  if (!account) {
    throw new AppError("Unauthorized", 401);
  }

  return toPublicAccount(account);
};
