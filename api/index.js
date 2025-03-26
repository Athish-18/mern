import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js"; // Import user routes
import authRouter from "./routes/auth.route.js"; // Import auth routes




dotenv.config(); // Load environment variables

const app = express(); // Initialize Express

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO) // Use MONGO connection string from .env file
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Middleware to parse JSON request body
app.use(express.json());

app.use('/api/auth',authRouter)
app.use('/api/user',userRouter);

// Make sure this is placed before your route handling

// Set up routes
// Starting the server
app.listen(3000, () => {
  console.log("Server is running on port 3000!")});

  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  });