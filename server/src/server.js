import bcrypt from "bcryptjs";
import app from "./app.js";
import { config } from "./config/index.js";
import { disconnectDB, prisma } from "./config/db.js";


async function initDatabase() {
  const passwordHash = await bcrypt.hash("12345678", config.bcrypt.saltRounds);

  await prisma.account.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      username: "admin",
      password: passwordHash,
      email: "admin@greencycle.com",
      role: "ADMIN",
    },
  });

  console.log("Database initialized");
}

initDatabase()
  .then(() => {
    app.listen(config.port, "0.0.0.0", () => {
      console.log(`Server listening on port ${config.port}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed", error);
    process.exit(1);
  });

const shutdown = async () => {
  await disconnectDB();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
