-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'DRIVER', 'ADMIN', 'PARTNER_STAFF');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('PENDING', 'VERIFYING', 'APPROVED', 'ASSIGNED', 'COLLECTING', 'ARRIVED', 'COLLECTED', 'IN_TRANSIT', 'AT_WAREHOUSE', 'COMPLETED', 'CANCELLED', 'REJECTED', 'FAILED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARN_RECYCLING', 'REDEEM_REWARD', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('DIGITAL_VOUCHER', 'PHYSICAL_PRODUCT');

-- CreateTable
CREATE TABLE "Account" (
    "idAccount" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("idAccount")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "idRefreshToken" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "idAccount" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("idRefreshToken")
);

-- CreateTable
CREATE TABLE "Customer" (
    "idCustomer" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "isEnterprise" BOOLEAN NOT NULL DEFAULT false,
    "idAccount" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("idCustomer")
);

-- CreateTable
CREATE TABLE "Enterprise" (
    "idEnterprise" TEXT NOT NULL,
    "idCustomer" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxCode" TEXT NOT NULL,
    "industry" TEXT,
    "contactPerson" TEXT,

    CONSTRAINT "Enterprise_pkey" PRIMARY KEY ("idEnterprise")
);

-- CreateTable
CREATE TABLE "Driver" (
    "idDriver" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "vehicleInfo" TEXT,
    "licensePlate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "idAccount" TEXT NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("idDriver")
);

-- CreateTable
CREATE TABLE "RecyclingPartner" (
    "idPartner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "idAccount" TEXT NOT NULL,

    CONSTRAINT "RecyclingPartner_pkey" PRIMARY KEY ("idPartner")
);

-- CreateTable
CREATE TABLE "Address" (
    "idAddress" TEXT NOT NULL,
    "idCustomer" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "ward" TEXT,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Ho Chi Minh',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("idAddress")
);

-- CreateTable
CREATE TABLE "CollectionCluster" (
    "idCluster" TEXT NOT NULL,
    "idDriver" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "district" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "CollectionCluster_pkey" PRIMARY KEY ("idCluster")
);

-- CreateTable
CREATE TABLE "PickupRequest" (
    "idRequest" TEXT NOT NULL,
    "idCustomer" TEXT NOT NULL,
    "idAddress" TEXT NOT NULL,
    "idPartner" TEXT,
    "status" "PickupStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("idRequest")
);

-- CreateTable
CREATE TABLE "PickupAssignment" (
    "idAssignment" TEXT NOT NULL,
    "idRequest" TEXT NOT NULL,
    "idDriver" TEXT NOT NULL,
    "idCluster" TEXT,
    "routeOrder" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickupAssignment_pkey" PRIMARY KEY ("idAssignment")
);

-- CreateTable
CREATE TABLE "PickupTimeline" (
    "idTimeline" TEXT NOT NULL,
    "idRequest" TEXT NOT NULL,
    "status" "PickupStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "PickupTimeline_pkey" PRIMARY KEY ("idTimeline")
);

-- CreateTable
CREATE TABLE "WasteCategory" (
    "idCategory" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "co2Factor" DOUBLE PRECISION NOT NULL,
    "pointFactor" INTEGER NOT NULL,
    "hazardLevel" TEXT NOT NULL DEFAULT 'Low',
    "pricePerKg" DOUBLE PRECISION,
    "iconUrl" TEXT,

    CONSTRAINT "WasteCategory_pkey" PRIMARY KEY ("idCategory")
);

-- CreateTable
CREATE TABLE "WasteItem" (
    "idItem" TEXT NOT NULL,
    "idRequest" TEXT NOT NULL,
    "idCategory" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WasteItem_pkey" PRIMARY KEY ("idItem")
);

-- CreateTable
CREATE TABLE "WasteImage" (
    "idImage" TEXT NOT NULL,
    "idItem" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteImage_pkey" PRIMARY KEY ("idImage")
);

-- CreateTable
CREATE TABLE "EcoWallet" (
    "idWallet" TEXT NOT NULL,
    "idCustomer" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EcoWallet_pkey" PRIMARY KEY ("idWallet")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "idTransaction" TEXT NOT NULL,
    "idWallet" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("idTransaction")
);

-- CreateTable
CREATE TABLE "GreenPassport" (
    "idPassport" TEXT NOT NULL,
    "idCustomer" TEXT NOT NULL,
    "totalKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCO2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "badge" TEXT,

    CONSTRAINT "GreenPassport_pkey" PRIMARY KEY ("idPassport")
);

-- CreateTable
CREATE TABLE "Reward" (
    "idReward" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RewardType" NOT NULL,
    "pointCost" INTEGER NOT NULL,
    "partnerName" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("idReward")
);

-- CreateTable
CREATE TABLE "RewardInventory" (
    "idInventory" TEXT NOT NULL,
    "idReward" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RewardInventory_pkey" PRIMARY KEY ("idInventory")
);

-- CreateTable
CREATE TABLE "VoucherCode" (
    "idVoucher" TEXT NOT NULL,
    "idInventory" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiryDate" TIMESTAMP(3),

    CONSTRAINT "VoucherCode_pkey" PRIMARY KEY ("idVoucher")
);

-- CreateTable
CREATE TABLE "RewardExchange" (
    "idExchange" TEXT NOT NULL,
    "idCustomer" TEXT NOT NULL,
    "idReward" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "voucherCodeUsed" TEXT,

    CONSTRAINT "RewardExchange_pkey" PRIMARY KEY ("idExchange")
);

-- CreateTable
CREATE TABLE "Notification" (
    "idNotification" TEXT NOT NULL,
    "idAccount" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("idNotification")
);

-- CreateTable
CREATE TABLE "ESGReport" (
    "idReport" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalRequests" INTEGER NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "totalCO2Saved" DOUBLE PRECISION NOT NULL,
    "hazardousWaste" DOUBLE PRECISION NOT NULL,
    "recycledRate" DOUBLE PRECISION NOT NULL,
    "enterpriseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ESGReport_pkey" PRIMARY KEY ("idReport")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "idLog" TEXT NOT NULL,
    "idAccount" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetTable" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("idLog")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_username_key" ON "Account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_idAccount_idx" ON "RefreshToken"("idAccount");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phoneNumber_key" ON "Customer"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_idAccount_key" ON "Customer"("idAccount");

-- CreateIndex
CREATE UNIQUE INDEX "Enterprise_idCustomer_key" ON "Enterprise"("idCustomer");

-- CreateIndex
CREATE UNIQUE INDEX "Enterprise_taxCode_key" ON "Enterprise"("taxCode");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phoneNumber_key" ON "Driver"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_idAccount_key" ON "Driver"("idAccount");

-- CreateIndex
CREATE UNIQUE INDEX "RecyclingPartner_licenseNumber_key" ON "RecyclingPartner"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RecyclingPartner_idAccount_key" ON "RecyclingPartner"("idAccount");

-- CreateIndex
CREATE UNIQUE INDEX "PickupAssignment_idRequest_key" ON "PickupAssignment"("idRequest");

-- CreateIndex
CREATE UNIQUE INDEX "WasteCategory_name_key" ON "WasteCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EcoWallet_idCustomer_key" ON "EcoWallet"("idCustomer");

-- CreateIndex
CREATE UNIQUE INDEX "GreenPassport_idCustomer_key" ON "GreenPassport"("idCustomer");

-- CreateIndex
CREATE UNIQUE INDEX "RewardInventory_idReward_key" ON "RewardInventory"("idReward");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherCode_code_key" ON "VoucherCode"("code");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_idAccount_fkey" FOREIGN KEY ("idAccount") REFERENCES "Account"("idAccount") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_idAccount_fkey" FOREIGN KEY ("idAccount") REFERENCES "Account"("idAccount") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enterprise" ADD CONSTRAINT "Enterprise_idCustomer_fkey" FOREIGN KEY ("idCustomer") REFERENCES "Customer"("idCustomer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_idAccount_fkey" FOREIGN KEY ("idAccount") REFERENCES "Account"("idAccount") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecyclingPartner" ADD CONSTRAINT "RecyclingPartner_idAccount_fkey" FOREIGN KEY ("idAccount") REFERENCES "Account"("idAccount") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_idCustomer_fkey" FOREIGN KEY ("idCustomer") REFERENCES "Customer"("idCustomer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCluster" ADD CONSTRAINT "CollectionCluster_idDriver_fkey" FOREIGN KEY ("idDriver") REFERENCES "Driver"("idDriver") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_idCustomer_fkey" FOREIGN KEY ("idCustomer") REFERENCES "Customer"("idCustomer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_idAddress_fkey" FOREIGN KEY ("idAddress") REFERENCES "Address"("idAddress") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_idPartner_fkey" FOREIGN KEY ("idPartner") REFERENCES "RecyclingPartner"("idPartner") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAssignment" ADD CONSTRAINT "PickupAssignment_idRequest_fkey" FOREIGN KEY ("idRequest") REFERENCES "PickupRequest"("idRequest") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAssignment" ADD CONSTRAINT "PickupAssignment_idDriver_fkey" FOREIGN KEY ("idDriver") REFERENCES "Driver"("idDriver") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupAssignment" ADD CONSTRAINT "PickupAssignment_idCluster_fkey" FOREIGN KEY ("idCluster") REFERENCES "CollectionCluster"("idCluster") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupTimeline" ADD CONSTRAINT "PickupTimeline_idRequest_fkey" FOREIGN KEY ("idRequest") REFERENCES "PickupRequest"("idRequest") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteItem" ADD CONSTRAINT "WasteItem_idRequest_fkey" FOREIGN KEY ("idRequest") REFERENCES "PickupRequest"("idRequest") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteItem" ADD CONSTRAINT "WasteItem_idCategory_fkey" FOREIGN KEY ("idCategory") REFERENCES "WasteCategory"("idCategory") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteImage" ADD CONSTRAINT "WasteImage_idItem_fkey" FOREIGN KEY ("idItem") REFERENCES "WasteItem"("idItem") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcoWallet" ADD CONSTRAINT "EcoWallet_idCustomer_fkey" FOREIGN KEY ("idCustomer") REFERENCES "Customer"("idCustomer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_idWallet_fkey" FOREIGN KEY ("idWallet") REFERENCES "EcoWallet"("idWallet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreenPassport" ADD CONSTRAINT "GreenPassport_idCustomer_fkey" FOREIGN KEY ("idCustomer") REFERENCES "Customer"("idCustomer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardInventory" ADD CONSTRAINT "RewardInventory_idReward_fkey" FOREIGN KEY ("idReward") REFERENCES "Reward"("idReward") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherCode" ADD CONSTRAINT "VoucherCode_idInventory_fkey" FOREIGN KEY ("idInventory") REFERENCES "RewardInventory"("idInventory") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardExchange" ADD CONSTRAINT "RewardExchange_idCustomer_fkey" FOREIGN KEY ("idCustomer") REFERENCES "Customer"("idCustomer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardExchange" ADD CONSTRAINT "RewardExchange_idReward_fkey" FOREIGN KEY ("idReward") REFERENCES "Reward"("idReward") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_idAccount_fkey" FOREIGN KEY ("idAccount") REFERENCES "Account"("idAccount") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_idAccount_fkey" FOREIGN KEY ("idAccount") REFERENCES "Account"("idAccount") ON DELETE RESTRICT ON UPDATE CASCADE;
