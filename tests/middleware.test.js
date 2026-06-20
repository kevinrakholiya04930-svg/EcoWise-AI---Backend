const request = require("supertest");
const app = require("../server");

describe("Protected Routes", () => {
  it("should reject request without token", async () => {
    const res = await request(app)
      .get("/api/v1/user/profile");

    expect(res.statusCode).toBe(401);
  });
});