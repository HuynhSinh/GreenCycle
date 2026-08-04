import { prisma } from "../config/db.js";

const buildDriverWhere = ({ q, status }) => {
  const where = {
    role: "DRIVER",
  };

  if (status === "ACTIVE") {
    where.driver = {
      is: {
        isActive: true,
      },
    };
  }

  if (status === "INACTIVE") {
    where.driver = {
      is: {
        isActive: false,
      },
    };
  }

  if (status === "PENDING_PROFILE") {
    where.driver = {
      is: null,
    };
  }

  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { driver: { is: { fullName: { contains: q, mode: "insensitive" } } } },
      { driver: { is: { phoneNumber: { contains: q, mode: "insensitive" } } } },
      { driver: { is: { licensePlate: { contains: q, mode: "insensitive" } } } },
    ];
  }

  return where;
};

const accountInclude = {
  driver: {
    include: {
      assignments: {
        include: {
          request: true,
        },
      },
    },
  },
};

export const findDriverAccounts = ({ q, status, skip, take }) =>
  prisma.account.findMany({
    where: buildDriverWhere({ q, status }),
    skip,
    take,
    orderBy: [{ createdAt: "desc" }],
    include: accountInclude,
  });

export const countDriverAccounts = ({ q, status }) =>
  prisma.account.count({
    where: buildDriverWhere({ q, status }),
  });

export const findDriverAccountById = (idAccount) =>
  prisma.account.findFirst({
    where: {
      idAccount,
      role: "DRIVER",
    },
    include: accountInclude,
  });

export const findAccountByUsername = (username) =>
  prisma.account.findUnique({
    where: { username },
  });

export const findAccountByEmail = (email) =>
  prisma.account.findUnique({
    where: { email },
  });

export const findDriverByPhoneNumber = (phoneNumber) =>
  prisma.driver.findUnique({
    where: { phoneNumber },
  });

export const findDriverAccountByAccountId = (idAccount) =>
  prisma.account.findFirst({
    where: {
      idAccount,
      role: "DRIVER",
    },
    include: accountInclude,
  });

export const createDriverAccount = ({ account, driver }) =>
  prisma.account.create({
    data: {
      ...account,
      ...(driver
        ? {
            driver: {
              create: driver,
            },
          }
        : {}),
    },
    include: accountInclude,
  });

export const updateDriverActiveStatus = ({ idDriver, isActive }) =>
  prisma.driver.update({
    where: { idDriver },
    data: { isActive },
  });

export const updateOwnDriverProfile = ({ idAccount, email, driver }) =>
  prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { idAccount },
      data: { email },
    });

    await tx.driver.upsert({
      where: { idAccount },
      create: {
        ...driver,
        idAccount,
        isActive: false,
      },
      update: {
        ...driver,
        isActive: false,
      },
    });

    return tx.account.findUnique({
      where: { idAccount },
      include: accountInclude,
    });
  });
