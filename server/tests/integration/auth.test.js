import { jest } from "@jest/globals";

const mockUser = {
  id: "account-1",
  username: "demo_user",
  email: "demo@example.com",
  role: "CUSTOMER",
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.unstable_mockModule("../../src/services/auth.service.js", () => ({
  register: jest.fn(async () => ({
    user: mockUser,
    tokens: {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    },
  })),
  login: jest.fn(async () => ({
    user: mockUser,
    tokens: {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    },
  })),
  logout: jest.fn(async () => undefined),
  getMe: jest.fn(async () => mockUser),
}));

const request = (await import("supertest")).default;
const app = (await import("../../src/app.js")).default;
const authService = await import("../../src/services/auth.service.js");
const { signAccessToken } = await import("../../src/utils/token.util.js");

describe("auth routes", () => {
  it("rejects invalid register payloads", async () => {
    const res = await request(app).post("/register").send({
      username: "ab",
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid request payload");
  });

  it("registers and sets httpOnly auth cookies", async () => {
    const res = await request(app).post("/register").send({
      username: "demo_user",
      email: "demo@example.com",
      password: "strong-password",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual(mockUser);
    expect(res.headers["set-cookie"].join(";")).toContain("HttpOnly");
    expect(res.headers["set-cookie"].join(";")).toContain("SameSite=Lax");
  });

  it("logs in with a generic success response and cookies", async () => {
    const res = await request(app).post("/login").send({
      email: "demo@example.com",
      password: "strong-password",
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(mockUser);
    expect(res.headers["set-cookie"]).toHaveLength(2);
  });

  it("rejects /me without an access cookie", async () => {
    const res = await request(app).get("/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("returns /me when the access token cookie is valid", async () => {
    const token = signAccessToken({
      idAccount: mockUser.id,
      role: mockUser.role,
    });

    const res = await request(app).get("/me").set("Cookie", [`accessToken=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(mockUser);
    expect(authService.getMe).toHaveBeenCalledWith(mockUser.id);
  });
});
