import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function ensureAccount(username, email, password, role) {
  const existing = await prisma.account.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  if (!existing) {
    return prisma.account.create({
      data: {
        username,
        email,
        password: passwordHash,
        role,
      },
    });
  }

  return prisma.account.update({
    where: { idAccount: existing.idAccount },
    data: {
      username,
      email,
      password: passwordHash,
      role,
    },
  });
}

async function resetDemoDataForCustomer(customerId) {
  const requests = await prisma.pickupRequest.findMany({
    where: { idCustomer: customerId },
    select: { idRequest: true },
  });

  const requestIds = requests.map((request) => request.idRequest);

  if (requestIds.length > 0) {
    const items = await prisma.wasteItem.findMany({
      where: { idRequest: { in: requestIds } },
      select: { idItem: true },
    });

    const itemIds = items.map((item) => item.idItem);

    if (itemIds.length > 0) {
      await prisma.wasteImage.deleteMany({ where: { idItem: { in: itemIds } } });
    }

    await prisma.wasteItem.deleteMany({ where: { idRequest: { in: requestIds } } });
    await prisma.pickupTimeline.deleteMany({ where: { idRequest: { in: requestIds } } });
    await prisma.pickupAssignment.deleteMany({ where: { idRequest: { in: requestIds } } });
  }

  await prisma.pickupRequest.deleteMany({ where: { idCustomer: customerId } });
  await prisma.address.deleteMany({ where: { idCustomer: customerId } });
  await prisma.rewardExchange.deleteMany({ where: { idCustomer: customerId } });
  await prisma.ecoWallet.deleteMany({ where: { idCustomer: customerId } });
  await prisma.greenPassport.deleteMany({ where: { idCustomer: customerId } });
}

async function main() {
  console.log("Starting seed...");

  const adminAccount = await ensureAccount("admin", "admin@greencycle.local", "Admin@123", "ADMIN");
  const customerAccount = await ensureAccount("customer", "customer@greencycle.local", "Customer@123", "CUSTOMER");
  const driverAccount = await ensureAccount("driver", "driver@greencycle.local", "Driver@123", "DRIVER");
  const partnerAccount = await ensureAccount("partner", "partner@greencycle.local", "Partner@123", "PARTNER_STAFF");

  const existingCustomer = await prisma.customer.findUnique({
    where: { idAccount: customerAccount.idAccount },
  });

  if (existingCustomer) {
    await prisma.enterprise.deleteMany({ where: { idCustomer: existingCustomer.idCustomer } });
    await resetDemoDataForCustomer(existingCustomer.idCustomer);
  }

  await prisma.pickupAssignment.deleteMany({});
  await prisma.collectionCluster.deleteMany({});
  await prisma.wasteImage.deleteMany({});
  await prisma.wasteItem.deleteMany({});
  await prisma.pickupTimeline.deleteMany({});
  await prisma.pickupRequest.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.rewardExchange.deleteMany({});
  await prisma.voucherCode.deleteMany({});
  await prisma.rewardInventory.deleteMany({});
  await prisma.reward.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.ecoWallet.deleteMany({});
  await prisma.greenPassport.deleteMany({});
  await prisma.enterprise.deleteMany({});
  await prisma.customer.deleteMany({ where: { idAccount: customerAccount.idAccount } });
  await prisma.driver.deleteMany({ where: { idAccount: driverAccount.idAccount } });
  await prisma.recyclingPartner.deleteMany({ where: { idAccount: partnerAccount.idAccount } });
  await prisma.refreshToken.deleteMany({ where: { idAccount: { in: [adminAccount.idAccount, customerAccount.idAccount, driverAccount.idAccount, partnerAccount.idAccount] } } });
  await prisma.notification.deleteMany({ where: { idAccount: { in: [adminAccount.idAccount, customerAccount.idAccount, driverAccount.idAccount, partnerAccount.idAccount] } } });
  await prisma.auditLog.deleteMany({ where: { idAccount: { in: [adminAccount.idAccount, customerAccount.idAccount, driverAccount.idAccount, partnerAccount.idAccount] } } });

  const customer = await prisma.customer.create({
    data: {
      idAccount: customerAccount.idAccount,
      fullName: "Nguyễn Văn An",
      phoneNumber: "0909123456",
      isEnterprise: false,
    },
  });

  const driver = await prisma.driver.create({
    data: {
      idAccount: driverAccount.idAccount,
      fullName: "Trần Văn Bảo",
      phoneNumber: "0909234567",
      vehicleInfo: "Xe máy điện",
      licensePlate: "59A-12345",
      isActive: true,
      currentLat: 10.762,
      currentLng: 106.682,
    },
  });

  const partner = await prisma.recyclingPartner.create({
    data: {
      idAccount: partnerAccount.idAccount,
      name: "Green Hub Recycling",
      licenseNumber: "GH-2026-001",
      address: "123 Lê Văn Việt, Quận 9",
      contactPhone: "02812345678",
      status: true,
    },
  });

  await prisma.enterprise.create({
    data: {
      idCustomer: customer.idCustomer,
      companyName: "GreenCycle Labs",
      taxCode: "TAX-001",
      industry: "Recycling",
      contactPerson: "Nguyễn Văn An",
    },
  });

  const address = await prisma.address.create({
    data: {
      idCustomer: customer.idCustomer,
      label: "Nhà riêng",
      addressLine: "123 Nguyễn Văn Cừ",
      ward: "Phường 4",
      district: "Quận 5",
      city: "Ho Chi Minh",
      latitude: 10.758,
      longitude: 106.68,
      isDefault: true,
    },
  });

  const wallet = await prisma.ecoWallet.create({
    data: {
      idCustomer: customer.idCustomer,
      balance: 150,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        idWallet: wallet.idWallet,
        type: "EARN_RECYCLING",
        amount: 150,
        description: "Điểm thưởng thu gom mẫu",
      },
      {
        idWallet: wallet.idWallet,
        type: "REDEEM_REWARD",
        amount: -50,
        description: "Đổi quà voucher",
      },
    ],
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

  const categories = [
    { name: "Plastic", co2Factor: 1.8, pointFactor: 10, hazardLevel: "Low", pricePerKg: 5000, iconUrl: null },
    { name: "Paper", co2Factor: 1.2, pointFactor: 8, hazardLevel: "Low", pricePerKg: 3000, iconUrl: null },
    { name: "Metal", co2Factor: 2.5, pointFactor: 15, hazardLevel: "Medium", pricePerKg: 12000, iconUrl: null },
    { name: "Glass", co2Factor: 0.9, pointFactor: 6, hazardLevel: "Low", pricePerKg: 2500, iconUrl: null },
    { name: "E-waste", co2Factor: 3.2, pointFactor: 20, hazardLevel: "High", pricePerKg: 18000, iconUrl: null },
  ];

  for (const category of categories) {
    await prisma.wasteCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  const plasticCategory = await prisma.wasteCategory.findUnique({
    where: { name: "Plastic" },
  });

  if (!plasticCategory) {
    throw new Error("Plastic category was not created");
  }

  const request = await prisma.pickupRequest.create({
    data: {
      idCustomer: customer.idCustomer,
      idAddress: address.idAddress,
      idPartner: partner.idPartner,
      status: "PENDING",
      scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      totalPoints: 0,
      totalWeight: 0,
      note: "Seed demo request",
    },
  });

  const wasteItem = await prisma.wasteItem.create({
    data: {
      idRequest: request.idRequest,
      idCategory: plasticCategory.idCategory,
      weight: 3.5,
      pointsEarned: 35,
    },
  });

  await prisma.wasteImage.create({
    data: {
      idItem: wasteItem.idItem,
      url: "https://example.com/plastic-before.jpg",
      type: "BEFORE_PICKUP",
    },
  });

  const cluster = await prisma.collectionCluster.create({
    data: {
      idDriver: driver.idDriver,
      scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 12),
      district: "Quận 5",
      status: "OPEN",
    },
  });

  await prisma.pickupAssignment.create({
    data: {
      idRequest: request.idRequest,
      idDriver: driver.idDriver,
      idCluster: cluster.idCluster,
      routeOrder: 1,
    },
  });

  await prisma.pickupTimeline.create({
    data: {
      idRequest: request.idRequest,
      status: "PENDING",
      note: "Seed data created",
      createdBy: adminAccount.idAccount,
    },
  });

  let reward = await prisma.reward.findFirst({ where: { name: "Eco Voucher" } });
  if (!reward) {
    reward = await prisma.reward.create({
      data: {
        name: "Eco Voucher",
        description: "Voucher giảm giá cho khách hàng tái chế",
        type: "DIGITAL_VOUCHER",
        pointCost: 100,
        partnerName: "Green Hub Recycling",
        imageUrl: "https://example.com/voucher.png",
      },
    });
  }

  let inventory = await prisma.rewardInventory.findUnique({ where: { idReward: reward.idReward } });
  if (!inventory) {
    inventory = await prisma.rewardInventory.create({
      data: {
        idReward: reward.idReward,
        stockQuantity: 20,
        isUnlimited: false,
      },
    });
  }

  await prisma.voucherCode.createMany({
    data: [
      {
        idInventory: inventory.idInventory,
        code: "ECO-1001",
        isUsed: false,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
      {
        idInventory: inventory.idInventory,
        code: "ECO-1002",
        isUsed: true,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      },
    ],
  });

  await prisma.rewardExchange.create({
    data: {
      idCustomer: customer.idCustomer,
      idReward: reward.idReward,
      status: "SUCCESS",
      voucherCodeUsed: "ECO-1001",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        idAccount: adminAccount.idAccount,
        title: "Seed data ready",
        body: "Demo accounts and sample pickup data were created successfully.",
        isRead: false,
      },
      {
        idAccount: customerAccount.idAccount,
        title: "Welcome",
        body: "You can now view your sample pickup request in the dashboard.",
        isRead: false,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        idAccount: adminAccount.idAccount,
        action: "SEED_DEMO_DATA",
        targetTable: "Account",
        targetId: adminAccount.idAccount,
        oldValue: null,
        newValue: { role: adminAccount.role },
      },
      {
        idAccount: adminAccount.idAccount,
        action: "SEED_DEMO_DATA",
        targetTable: "PickupRequest",
        targetId: request.idRequest,
        oldValue: null,
        newValue: { status: request.status },
      },
    ],
  });

  await prisma.eSGReport.create({
    data: {
      title: "Demo ESG Report",
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      endDate: new Date(),
      totalRequests: 1,
      totalWeight: 3.5,
      totalCO2Saved: 6.3,
      hazardousWaste: 0,
      recycledRate: 0.85,
      enterpriseId: "demo-enterprise",
    },
  });

  console.log("Seed completed successfully.");
  console.log("Login with:");
  console.log("- admin@greencycle.local / Admin@123");
  console.log("- customer@greencycle.local / Customer@123");
  console.log("- driver@greencycle.local / Driver@123");
  console.log("- partner@greencycle.local / Partner@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
