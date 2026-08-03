import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: "../.env" });
dotenv.config({ override: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const hashPassword = (password) => bcrypt.hash(password, 12);

async function ensureAccount({ username, email, password, role }) {
  const existing = await prisma.account.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  const data = {
    username,
    email,
    password: await hashPassword(password),
    role,
  };

  if (!existing) {
    return prisma.account.create({ data });
  }

  return prisma.account.update({
    where: { idAccount: existing.idAccount },
    data,
  });
}

async function resetDemoData() {
  await prisma.wasteImage.deleteMany({});
  await prisma.pickupAssignment.deleteMany({});
  await prisma.pickupTimeline.deleteMany({});
  await prisma.wasteItem.deleteMany({});
  await prisma.pickupRequest.deleteMany({});
  await prisma.collectionCluster.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.rewardExchange.deleteMany({});
  await prisma.voucherCode.deleteMany({});
  await prisma.rewardInventory.deleteMany({});
  await prisma.reward.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.ecoWallet.deleteMany({});
  await prisma.greenPassport.deleteMany({});
  await prisma.enterprise.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.recyclingPartner.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
}

async function ensureWasteCategory(name, pointFactor, hazardLevel = "Low") {
  return prisma.wasteCategory.upsert({
    where: { name },
    update: {
      pointFactor,
      hazardLevel,
    },
    create: {
      name,
      co2Factor: 2,
      pointFactor,
      hazardLevel,
      pricePerKg: 10000,
    },
  });
}

async function createCustomerProfile({ account, fullName, phoneNumber, addressLine, ward }) {
  const customer = await prisma.customer.create({
    data: {
      idAccount: account.idAccount,
      fullName,
      phoneNumber,
      isEnterprise: false,
    },
  });

  const address = await prisma.address.create({
    data: {
      idCustomer: customer.idCustomer,
      label: "Pickup address",
      addressLine,
      ward,
      district: "District 5",
      city: "Ho Chi Minh",
      latitude: 10.754,
      longitude: 106.666,
      isDefault: true,
    },
  });

  await prisma.ecoWallet.create({
    data: {
      idCustomer: customer.idCustomer,
      balance: 150,
    },
  });

  await prisma.greenPassport.create({
    data: {
      idCustomer: customer.idCustomer,
      totalKg: 12.5,
      totalCO2: 18.4,
      totalPoints: 250,
      level: 2,
      badge: "Eco Warrior",
    },
  });

  return { customer, address };
}

async function createPickup({ customer, address, status, scheduledTime, totalWeight, categories, cluster, driver, routeOrder }) {
  const request = await prisma.pickupRequest.create({
    data: {
      idCustomer: customer.idCustomer,
      idAddress: address.idAddress,
      status,
      scheduledTime,
      totalWeight,
      totalPoints: Math.round(totalWeight * 20),
      note: "Seed schedule request",
    },
  });

  for (const category of categories) {
    await prisma.wasteItem.create({
      data: {
        idRequest: request.idRequest,
        idCategory: category.idCategory,
        weight: totalWeight / categories.length,
        pointsEarned: Math.round((totalWeight / categories.length) * category.pointFactor),
      },
    });
  }

  await prisma.pickupTimeline.create({
    data: {
      idRequest: request.idRequest,
      status,
      note: "Seed data created",
    },
  });

  if (driver) {
    await prisma.pickupAssignment.create({
      data: {
        idRequest: request.idRequest,
        idDriver: driver.idDriver,
        idCluster: cluster?.idCluster,
        routeOrder,
      },
    });
  }

  return request;
}

async function main() {
  console.log("Starting seed...");

  await resetDemoData();

  const adminAccount = await ensureAccount({
    username: "admin",
    email: "admin@greencycle.com",
    password: "12345678",
    role: "ADMIN",
  });

  const customerAccounts = await Promise.all([
    ensureAccount({ username: "lan_nguyen", email: "lan.nguyen@greencycle.local", password: "12345678", role: "CUSTOMER" }),
    ensureAccount({ username: "viet_hoa", email: "viet.hoa@greencycle.local", password: "12345678", role: "CUSTOMER" }),
    ensureAccount({ username: "minh_tran", email: "minh.tran@greencycle.local", password: "12345678", role: "CUSTOMER" }),
    ensureAccount({ username: "cho_quan_school", email: "school@greencycle.local", password: "12345678", role: "CUSTOMER" }),
    ensureAccount({ username: "an_khang_clinic", email: "clinic@greencycle.local", password: "12345678", role: "CUSTOMER" }),
  ]);

  const driverAccounts = await Promise.all([
    ensureAccount({ username: "quang_pham", email: "quang.pham@greencycle.local", password: "12345678", role: "DRIVER" }),
    ensureAccount({ username: "mai_le", email: "mai.le@greencycle.local", password: "12345678", role: "DRIVER" }),
    ensureAccount({ username: "tuan_do", email: "tuan.do@greencycle.local", password: "12345678", role: "DRIVER" }),
    ensureAccount({ username: "hanh_vo", email: "hanh.vo@greencycle.local", password: "12345678", role: "DRIVER" }),
  ]);

  const [laptop, phone, monitor, printer, tablet, battery, labDevice, appliance] = await Promise.all([
    ensureWasteCategory("Laptop", 22, "Medium"),
    ensureWasteCategory("Phone", 20, "Medium"),
    ensureWasteCategory("Monitor", 18, "Medium"),
    ensureWasteCategory("Printer", 16, "Low"),
    ensureWasteCategory("Tablet", 20, "Medium"),
    ensureWasteCategory("Battery", 25, "High"),
    ensureWasteCategory("Lab device", 18, "High"),
    ensureWasteCategory("Small appliance", 14, "Low"),
  ]);

  const customers = await Promise.all([
    createCustomerProfile({
      account: customerAccounts[0],
      fullName: "Lan Nguyen",
      phoneNumber: "0901000001",
      addressLine: "221 Tran Hung Dao",
      ward: "Ward 11",
    }),
    createCustomerProfile({
      account: customerAccounts[1],
      fullName: "Viet Hoa Office",
      phoneNumber: "0901000002",
      addressLine: "48 Nguyen Trai",
      ward: "Ward 3",
    }),
    createCustomerProfile({
      account: customerAccounts[2],
      fullName: "Minh Tran",
      phoneNumber: "0901000003",
      addressLine: "7 An Duong Vuong",
      ward: "Ward 8",
    }),
    createCustomerProfile({
      account: customerAccounts[3],
      fullName: "Cho Quan School",
      phoneNumber: "0901000004",
      addressLine: "103 Nguyen Bieu",
      ward: "Ward 1",
    }),
    createCustomerProfile({
      account: customerAccounts[4],
      fullName: "An Khang Clinic",
      phoneNumber: "0901000005",
      addressLine: "15 Tran Phu",
      ward: "Ward 4",
    }),
  ]);

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        idAccount: driverAccounts[0].idAccount,
        fullName: "Quang Pham",
        phoneNumber: "0911000001",
        vehicleInfo: "Van",
        licensePlate: "51A 902.18",
        isActive: true,
      },
    }),
    prisma.driver.create({
      data: {
        idAccount: driverAccounts[1].idAccount,
        fullName: "Mai Le",
        phoneNumber: "0911000002",
        vehicleInfo: "Truck",
        licensePlate: "50H 117.45",
        isActive: true,
      },
    }),
    prisma.driver.create({
      data: {
        idAccount: driverAccounts[2].idAccount,
        fullName: "Tuan Do",
        phoneNumber: "0911000003",
        vehicleInfo: "Van",
        licensePlate: "51B 430.22",
        isActive: true,
      },
    }),
    prisma.driver.create({
      data: {
        idAccount: driverAccounts[3].idAccount,
        fullName: "Hanh Vo",
        phoneNumber: "0911000004",
        vehicleInfo: "Bike",
        licensePlate: "59T1 834.91",
        isActive: false,
      },
    }),
  ]);

  const morningCluster = await prisma.collectionCluster.create({
    data: {
      idDriver: drivers[0].idDriver,
      scheduledDate: new Date("2026-08-04T08:30:00+07:00"),
      district: "District 5",
      status: "OPEN",
    },
  });

  const afternoonCluster = await prisma.collectionCluster.create({
    data: {
      idDriver: drivers[1].idDriver,
      scheduledDate: new Date("2026-08-04T13:00:00+07:00"),
      district: "District 5",
      status: "OPEN",
    },
  });

  await createPickup({
    customer: customers[0].customer,
    address: customers[0].address,
    status: "PENDING",
    scheduledTime: new Date("2026-08-04T09:30:00+07:00"),
    totalWeight: 7.2,
    categories: [laptop, phone],
    cluster: null,
    driver: null,
    routeOrder: null,
  });

  await createPickup({
    customer: customers[1].customer,
    address: customers[1].address,
    status: "APPROVED",
    scheduledTime: new Date("2026-08-04T10:15:00+07:00"),
    totalWeight: 18.5,
    categories: [monitor, printer],
    cluster: null,
    driver: null,
    routeOrder: null,
  });

  await createPickup({
    customer: customers[2].customer,
    address: customers[2].address,
    status: "ASSIGNED",
    scheduledTime: new Date("2026-08-04T14:00:00+07:00"),
    totalWeight: 4.4,
    categories: [tablet, battery],
    cluster: afternoonCluster,
    driver: drivers[1],
    routeOrder: 1,
  });

  await createPickup({
    customer: customers[3].customer,
    address: customers[3].address,
    status: "VERIFYING",
    scheduledTime: new Date("2026-08-04T14:15:00+07:00"),
    totalWeight: 22,
    categories: [labDevice],
    cluster: null,
    driver: null,
    routeOrder: null,
  });

  await createPickup({
    customer: customers[4].customer,
    address: customers[4].address,
    status: "APPROVED",
    scheduledTime: new Date("2026-08-04T15:45:00+07:00"),
    totalWeight: 11,
    categories: [appliance],
    cluster: afternoonCluster,
    driver: drivers[2],
    routeOrder: 2,
  });

  await prisma.notification.create({
    data: {
      idAccount: adminAccount.idAccount,
      title: "Seed data ready",
      body: "Collection schedule management demo data is ready.",
      isRead: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      idAccount: adminAccount.idAccount,
      action: "SEED_COLLECTION_SCHEDULE_DATA",
      targetTable: "PickupRequest",
      targetId: "collection-schedule-demo",
      oldValue: null,
      newValue: { requests: 5, drivers: 4, clusters: 2 },
    },
  });

  console.log("Seed completed successfully.");
  console.log("Login with:");
  console.log("- admin@greencycle.com / 12345678");
  console.log("- lan.nguyen@greencycle.local / 12345678");
  console.log("- quang.pham@greencycle.local / 12345678");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
