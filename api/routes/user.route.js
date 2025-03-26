import express from "express";
import { signup } from "../controller/auth.controller.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
// Define user routes
userRouter.get("/", (req, res) => {
  res.json({ message: "User route" });
});

export default userRouter;
