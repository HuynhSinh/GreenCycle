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

export const ensureCustomerProfileForAccount = ({ idAccount, username }) =>
  prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { idAccount },
      create: {
        idAccount,
        fullName: username,
        phoneNumber: `PENDING-${idAccount.slice(0, 24)}`,
        isEnterprise: false,
      },
      update: {},
    });

    await tx.ecoWallet.upsert({
      where: { idCustomer: customer.idCustomer },
      create: {
        idCustomer: customer.idCustomer,
        balance: 0,
      },
      update: {},
    });

    await tx.greenPassport.upsert({
      where: { idCustomer: customer.idCustomer },
      create: {
        idCustomer: customer.idCustomer,
        totalKg: 0,
        totalCO2: 0,
        totalPoints: 0,
        level: 1,
        badge: "Green Starter",
      },
      update: {},
    });

    return customer;
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
