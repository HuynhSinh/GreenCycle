import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";
import { config } from "../config/index.js";
import * as driverRepository from "../repositories/driver.repository.js";

const getDriverStatus = (account) => {
  if (!account.driver) return "PENDING_PROFILE";
  return account.driver.isActive ? "ACTIVE" : "INACTIVE";
};

const mapDriverAccount = (account) => {
  const activeAssignments = account.driver?.assignments?.filter((assignment) =>
    ["ASSIGNED", "COLLECTING", "ARRIVED", "COLLECTED", "IN_TRANSIT"].includes(assignment.request?.status),
  ) || [];
  const completedAssignments = account.driver?.assignments?.filter((assignment) =>
    ["COMPLETED", "AT_WAREHOUSE"].includes(assignment.request?.status),
  ) || [];

  return {
    id: account.idAccount,
    username: account.username,
    email: account.email,
    createdAt: account.createdAt,
    status: getDriverStatus(account),
    profileComplete: Boolean(account.driver),
    driver: account.driver
      ? {
          id: account.driver.idDriver,
          fullName: account.driver.fullName,
          phoneNumber: account.driver.phoneNumber,
          vehicleInfo: account.driver.vehicleInfo || "",
          licensePlate: account.driver.licensePlate || "",
          isActive: account.driver.isActive,
          currentLat: account.driver.currentLat,
          currentLng: account.driver.currentLng,
          activeAssignments: activeAssignments.length,
          completedAssignments: completedAssignments.length,
          totalAssignments: account.driver.assignments?.length || 0,
        }
      : null,
  };
};

export const listDrivers = async ({ q, status, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [accountsRaw, total] = await Promise.all([
    driverRepository.findDriverAccounts({ q, status, skip, take: limit }),
    driverRepository.countDriverAccounts({ q, status }),
  ]);
  const drivers = accountsRaw.map(mapDriverAccount);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    metrics: {
      totalDrivers: total,
      activeDrivers: drivers.filter((driver) => driver.status === "ACTIVE").length,
      inactiveDrivers: drivers.filter((driver) => driver.status === "INACTIVE").length,
      pendingProfiles: drivers.filter((driver) => driver.status === "PENDING_PROFILE").length,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
    },
    drivers,
  };
};

export const getDriver = async (accountId) => {
  const account = await driverRepository.findDriverAccountById(accountId);

  if (!account) {
    throw new AppError("Driver account not found", 404);
  }

  return mapDriverAccount(account);
};

export const getOwnDriverProfile = async (accountId) => {
  const account = await driverRepository.findDriverAccountByAccountId(accountId);

  if (!account) {
    throw new AppError("Driver account not found", 404);
  }

  return mapDriverAccount(account);
};

export const createDriverAccount = async (payload) => {
  const username = payload.username.trim();
  const email = payload.email?.trim()
    ? payload.email.trim().toLowerCase()
    : `${username}@drivers.greencycle.local`;
  const [existingUsername, existingEmail] = await Promise.all([
    driverRepository.findAccountByUsername(username),
    driverRepository.findAccountByEmail(email),
  ]);

  if (existingUsername) {
    throw new AppError("Username already exists", 409);
  }

  if (existingEmail) {
    throw new AppError("Email already exists", 409);
  }

  let driver = null;

  if (payload.fullName && payload.phoneNumber) {
    const existingPhone = await driverRepository.findDriverByPhoneNumber(payload.phoneNumber.trim());

    if (existingPhone) {
      throw new AppError("Driver phone number already exists", 409);
    }

    driver = {
      fullName: payload.fullName.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      vehicleInfo: payload.vehicleInfo || null,
      licensePlate: payload.licensePlate || null,
      isActive: false,
    };
  }

  const passwordHash = await bcrypt.hash(payload.password, config.bcrypt.saltRounds);
  const account = await driverRepository.createDriverAccount({
    account: {
      username,
      email,
      password: passwordHash,
      role: "DRIVER",
    },
    driver,
  });

  return mapDriverAccount(account);
};

const updateDriverStatus = async ({ accountId, isActive }) => {
  const account = await driverRepository.findDriverAccountById(accountId);

  if (!account) {
    throw new AppError("Driver account not found", 404);
  }

  if (!account.driver) {
    throw new AppError("Driver profile is not completed yet", 409);
  }

  await driverRepository.updateDriverActiveStatus({
    idDriver: account.driver.idDriver,
    isActive,
  });

  return getDriver(accountId);
};

export const approveDriver = (accountId) => updateDriverStatus({ accountId, isActive: true });

export const enableDriver = (accountId) => updateDriverStatus({ accountId, isActive: true });

export const disableDriver = (accountId) => updateDriverStatus({ accountId, isActive: false });

export const updateOwnDriverProfile = async (accountId, payload) => {
  const account = await driverRepository.findDriverAccountByAccountId(accountId);

  if (!account) {
    throw new AppError("Driver account not found", 404);
  }

  const email = payload.email.trim().toLowerCase();
  const phoneNumber = payload.phoneNumber.trim();

  const [existingEmail, existingPhone] = await Promise.all([
    driverRepository.findAccountByEmail(email),
    driverRepository.findDriverByPhoneNumber(phoneNumber),
  ]);

  if (existingEmail && existingEmail.idAccount !== accountId) {
    throw new AppError("Email already exists", 409);
  }

  if (existingPhone && existingPhone.idAccount !== accountId) {
    throw new AppError("Driver phone number already exists", 409);
  }

  const updatedAccount = await driverRepository.updateOwnDriverProfile({
    idAccount: accountId,
    email,
    driver: {
      fullName: payload.fullName.trim(),
      phoneNumber,
      vehicleInfo: payload.vehicleInfo.trim(),
      licensePlate: payload.licensePlate.trim(),
    },
  });

  return mapDriverAccount(updatedAccount);
};
