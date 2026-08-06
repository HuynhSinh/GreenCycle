import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import AppError from "../utils/AppError.js";
import { config } from "../config/index.js";
import {
  createAccount,
  createPasswordResetToken,
  createRefreshToken,
  deleteExpiredPasswordResetTokens,
  deleteExpiredRefreshTokensForAccount,
  deletePasswordResetTokenByHash,
  deletePasswordResetTokensForAccount,
  deleteRefreshTokenByHash,
  deleteRefreshTokensForAccount,
  ensureCustomerProfileForAccount,
  findAccountByEmail,
  findAccountById,
  findAccountByUsername,
  findPasswordResetTokenByHash,
  findRefreshTokenByHash,
  updateAccountPassword,
} from "../repositories/auth.repository.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token.util.js";
import { toPublicAccount } from "../utils/account.presenter.js";
import { sendPasswordResetOtp } from "./email.service.js";

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

const isRememberMeRefreshToken = (payload) => {
  const lifetimeSeconds = Number(payload.exp || 0) - Number(payload.iat || 0);
  const defaultLifetimeSeconds = Math.floor(config.jwt.refreshExpiresMs / 1000);

  return lifetimeSeconds > defaultLifetimeSeconds;
};

const createPasswordResetOtp = () => String(crypto.randomInt(100000, 1000000));

const getPasswordResetOtpHash = (email, otp) => hashToken(`${email.trim().toLowerCase()}:${otp.trim()}`);

const schedulePasswordResetTokenDeletion = (tokenHash) => {
  const timeout = setTimeout(() => {
    deletePasswordResetTokenByHash(tokenHash).catch(() => undefined);
  }, config.passwordReset.otpExpiresMinutes * 60 * 1000);

  timeout.unref?.();
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
  await ensureCustomerProfileForAccount(account);
  const tokens = await buildTokenPair(account, req, { rememberMe: Boolean(payload.rememberMe) });

  return {
    user: toPublicAccount(account),
    tokens,
  };
};

export const login = async (payload, req) => {
  const identifier = (payload.identifier || payload.email || "").trim().toLowerCase();

  const account = identifier.includes("@")
    ? await findAccountByEmail(identifier)
    : await findAccountByUsername(identifier);

  const isValidPassword = account
    ? await bcrypt.compare(payload.password, account.password)
    : false;

  if (!account || !isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  if (account.role === "CUSTOMER") {
    await ensureCustomerProfileForAccount(account);
  }

  const tokens = await buildTokenPair(account, req, { rememberMe: Boolean(payload.rememberMe) });

  return {
    user: toPublicAccount(account),
    tokens,
  };
};

export const requestPasswordReset = async (payload) => {
  const email = payload.email.trim().toLowerCase();
  const account = await findAccountByEmail(email);

  if (!account) {
    return {
      message: "If that email exists, a password reset OTP has been sent.",
    };
  }

  const otp = createPasswordResetOtp();
  const tokenHash = getPasswordResetOtpHash(email, otp);
  const expiresAt = new Date(Date.now() + config.passwordReset.otpExpiresMinutes * 60 * 1000);

  await Promise.all([
    deleteExpiredPasswordResetTokens(),
    deletePasswordResetTokensForAccount(account.idAccount),
  ]);
  await createPasswordResetToken({
    tokenHash,
    idAccount: account.idAccount,
    expiresAt,
  });

  schedulePasswordResetTokenDeletion(tokenHash);
  await sendPasswordResetOtp({
    to: email,
    otp,
    expiresMinutes: config.passwordReset.otpExpiresMinutes,
  });

  return {
    message: "If that email exists, a password reset OTP has been sent.",
    expiresInMinutes: config.passwordReset.otpExpiresMinutes,
  };
};

export const resetPassword = async (payload) => {
  const email = payload.email.trim().toLowerCase();
  const tokenHash = getPasswordResetOtpHash(email, payload.otp);
  const tokenRecord = await findPasswordResetTokenByHash(tokenHash);

  if (!tokenRecord || tokenRecord.expiresAt <= new Date()) {
    if (tokenRecord) {
      await deletePasswordResetTokenByHash(tokenHash);
    }
    throw new AppError("This reset OTP is invalid or has expired.", 400);
  }

  const account = await findAccountByEmail(email);

  if (!account || account.idAccount !== tokenRecord.idAccount) {
    throw new AppError("This reset OTP is invalid or has expired.", 400);
  }

  const passwordHash = await bcrypt.hash(payload.password, config.bcrypt.saltRounds);

  await updateAccountPassword(tokenRecord.idAccount, passwordHash);
  await Promise.all([
    deletePasswordResetTokenByHash(tokenHash),
    deleteRefreshTokensForAccount(tokenRecord.idAccount),
  ]);

  return {
    message: "Password has been reset successfully. Please sign in with your new password.",
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

export const refreshAccess = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Unauthorized", 401);
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Unauthorized", 401);
  }

  if (payload.type !== "refresh") {
    throw new AppError("Unauthorized", 401);
  }

  const tokenRecord = await findRefreshTokenByHash(hashToken(refreshToken));

  if (!tokenRecord || tokenRecord.idAccount !== payload.sub || tokenRecord.expiresAt <= new Date()) {
    throw new AppError("Unauthorized", 401);
  }

  const account = await findAccountById(payload.sub);

  if (!account) {
    throw new AppError("Unauthorized", 401);
  }

  const rememberMe = isRememberMeRefreshToken(payload);
  const accessToken = signAccessToken(account, { rememberMe });

  return {
    accessToken,
    rememberMe,
    user: {
      id: account.idAccount,
      role: account.role,
    },
  };
};

export const getMe = async (accountId) => {
  const account = await findAccountById(accountId);

  if (!account) {
    throw new AppError("Unauthorized", 401);
  }

  if (account.role === "CUSTOMER") {
    await ensureCustomerProfileForAccount(account);
  }

  return toPublicAccount(account);
};
