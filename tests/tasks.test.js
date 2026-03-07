import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/app.js";

dotenv.config();

let token;
let taskId;

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
  await mongoose.connection.collection('tasks').deleteMany({});

  await request(app)
    .post("/api/auth/register")
    .send({ email: "task@example.com", password: "123456" });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "task@example.com", password: "123456" });

  token = res.body.token;
}, 30000);

afterAll(async () => {
  await mongoose.connection.collection('users').deleteMany({});
  await mongoose.connection.collection('tasks').deleteMany({});
  await mongoose.connection.close();
}, 30000);

describe("Task Routes", () => {
  it("should not allow access without token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.statusCode).toBe(401);
  }, 15000);

  it("should create a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Task" });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Task");
    taskId = res.body._id;
  }, 15000);

  it("should get user tasks only", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  }, 15000);

  it("should delete a task", async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task deleted");
  }, 15000);
});