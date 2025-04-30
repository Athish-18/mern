// auth.controller.test.js
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth.route.js";
import User from "../models/user.model.js";

// Set up express app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe("Auth Controller", () => {
  it("should signup a user successfully", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toBe("User created successfully!"); // Checking response body instead of res.text
  });
});
