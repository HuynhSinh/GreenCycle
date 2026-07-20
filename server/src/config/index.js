import "dotenv/config";

const isTest = process.env.NODE_ENV === "test";
const isProduction = process.env.NODE_ENV === "production";

const requiredEnv = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

if (!isTest) {
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }
}

const parseDurationMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;

  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(value);
  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = match[2] || "ms";
  const factors = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * factors[unit];
};

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "test-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "test-refresh-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    refreshExpiresInRememberMe: process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER_ME || "30d",
    accessExpiresMs: parseDurationMs(process.env.JWT_ACCESS_EXPIRES_IN, 15 * 60 * 1000),
    refreshExpiresMs: parseDurationMs(process.env.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000),
    refreshExpiresMsRememberMe: parseDurationMs(
      process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER_ME || "30d",
      30 * 24 * 60 * 60 * 1000,
    ),
  },
  cookies: {
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : isProduction,
    sameSite: process.env.COOKIE_SAMESITE || "lax",
  },
  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  },
  rateLimit: {
    authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  },
};
