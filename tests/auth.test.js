const request = require("supertest");
const app = require("../server");

describe("Authentication API", () => {
  it("should register user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "test@test.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should not register duplicate email", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "test@test.com",
        password: "password123"
      });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "test@test.com",
        password: "password123"
      });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it("should login successfully", async () => {
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: "test@test.com",
        password: "password123"
      });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "test@test.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});