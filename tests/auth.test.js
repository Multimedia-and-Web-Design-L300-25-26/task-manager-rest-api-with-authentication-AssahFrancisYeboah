import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/app.js";

dotenv.config();

beforeAll(async () => {
  // Wait for mongoose to finish connecting (app.js connects asynchronously)
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
      setTimeout(resolve, 8000); // fallback
    });
  }
  await mongoose.connection.collection('users').deleteMany({});
}, 30000);

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({});
  await mongoose.connection.close();
}, 30000);

describe("Auth Routes", () => {
  let token;

  it("should register a user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "123456" });
    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe("test@example.com");
  }, 15000);

  it("should not register duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "123456" });
    expect(res.statusCode).toBe(409);
  }, 15000);

  it("should login user and return token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "123456" });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  }, 15000);

  it("should reject invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });
    expect(res.statusCode).toBe(401);
  }, 15000);
});