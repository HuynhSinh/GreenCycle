import { prisma } from "../config/db.js";

export const findAccountById = (idAccount) =>
  prisma.account.findUnique({
    where: { idAccount },
  });

export const findAccountByUsername = (username) =>
  prisma.account.findUnique({
    where: { username },
  });

export const findAccountByEmail = (email) =>
  prisma.account.findUnique({
    where: { email },
  });

export const createAccount = (data) =>
  prisma.account.create({
    data,
  });

export const createRefreshToken = (data) =>
  prisma.refreshToken.create({
    data,
  });

export const deleteRefreshTokenByHash = (tokenHash) =>
  prisma.refreshToken.deleteMany({
    where: { tokenHash },
  });

export const deleteExpiredRefreshTokensForAccount = (idAccount) =>
  prisma.refreshToken.deleteMany({
    where: {
      idAccount,
      expiresAt: {
        lt: new Date(),
      },
    },
  });
