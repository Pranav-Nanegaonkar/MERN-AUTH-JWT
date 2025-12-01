import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  verifyEmailHandler,
  sendPasswordRestHandler,
} from "../controllers/auth.controllers";

const authRoutes = Router();

authRoutes.post("/register", registerHandler);
authRoutes.post("/login", loginHandler);
authRoutes.get("/logout", logoutHandler);
authRoutes.get("/refresh", refreshHandler);
authRoutes.get("/email/verify/:code", verifyEmailHandler);
authRoutes.post("/password/forgot", sendPasswordRestHandler);

export default authRoutes;
