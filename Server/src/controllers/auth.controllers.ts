import expressAsyncHandler from "express-async-handler";
import z from "zod";
import { CREATED } from "../constants/http";
import { setAuthCookies, clearAuthCookie } from "../utils/cookies";
import { createAccount, loginUser } from "../services/auth.services";
import { loginSchema, registerSchema } from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";

export const registerHandler = expressAsyncHandler(async (req, res, next) => {
  // validate request
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // call service
  const { user, accessToken, refreshToken } = await createAccount(request);

  // return response
  setAuthCookies({ res, accessToken, refreshToken }).status(CREATED).json({
    message: "Account created successfully",
    data: { user },
  });
});

export const loginHandler = expressAsyncHandler(async (req, res, next) => {
  // validate request
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // call service
  const { user, accessToken, refreshToken } = await loginUser(request);

  // return response
  setAuthCookies({ res, accessToken, refreshToken }).json({
    message: "Login successful",
    data: { user },
  });
});

export const logoutHandler = expressAsyncHandler(async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const resultPayload = verifyToken(accessToken) as {
    payload?: { sessionId?: string };
  };
  if (resultPayload.payload && "sessionId" in resultPayload.payload) {
    console.log(resultPayload.payload.sessionId);

    await SessionModel.findByIdAndDelete(resultPayload.payload.sessionId);
  }

  clearAuthCookie({ res }).json({
    message: "Logout successful",
  });
});
