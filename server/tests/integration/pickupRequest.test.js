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

jest.unstable_mockModule("../../src/services/pickupRequest.service.js", () => ({
  createPickupRequest: jest.fn(async () => ({
    id: "req-1",
    status: "PENDING",
    scheduledTime: "2026-08-10T10:00:00.000Z",
    message: "Pickup request created successfully",
  })),
}));

const request = (await import("supertest")).default;
const app = (await import("../../src/app.js")).default;
const { signAccessToken } = await import("../../src/utils/token.util.js");
const pickupRequestService =
  await import("../../src/services/pickupRequest.service.js");

describe("customer pickup request routes", () => {
  it("creates a pickup request for a logged-in customer", async () => {
    const token = signAccessToken({
      idAccount: mockUser.id,
      role: mockUser.role,
    });

    const response = await request(app)
      .post("/customer/pickup-requests")
      .set("Cookie", [`accessToken=${token}`])
      .send({
        fullName: "Nguyen Van A",
        phoneNumber: "0901234567",
        addressLine: "123 Lê Lợi",
        ward: "Phường 1",
        district: "District 5",
        city: "Ho Chi Minh",
        latitude: 10.762,
        longitude: 106.66,
        scheduledTime: "2026-08-10T10:00:00.000Z",
        note: "Preferred morning pickup",
        wasteItems: [
          {
            categoryName: "Laptop",
            weight: 1.5,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Pickup request created successfully");
    expect(pickupRequestService.createPickupRequest).toHaveBeenCalled();
  });
});
