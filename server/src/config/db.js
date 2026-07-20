import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "./index.js";

const adapter = config.databaseUrl
  ? new PrismaPg({
      connectionString: config.databaseUrl,
    })
  : undefined;

export const prisma = new PrismaClient(adapter ? { adapter } : undefined);

export const connectDB = async () => {
  await prisma.$queryRaw`SELECT 1`;
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};
