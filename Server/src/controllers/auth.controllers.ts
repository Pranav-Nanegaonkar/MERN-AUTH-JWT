import expressAsyncHandler from "express-async-handler";
import { NextFunction, Request, Response } from "express";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import {
  setAuthCookies,
  clearAuthCookie,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../utils/cookies";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  verifyEmail,
} from "../services/auth.services";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  verificationCodeSchema,
} from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import AppError from "../utils/AppError";

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

export const refreshHandler = expressAsyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    throw new AppError("Missing Refresh Token", UNAUTHORIZED);
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await refreshUserAccessToken(refreshToken);

  if (newRefreshToken) {
    res
      .cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions())
      .json({
        message: "Refresh token updated",
      });
  }

  res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .json({
      message: "Access token refreshed",
    });
});

export const verifyEmailHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const verificationCode = verificationCodeSchema.parse(req.params.code);

    // call service

    const { user } = await verifyEmail(verificationCode);

    res.json(user);
  }
);

export const sendPasswordRestHandler = expressAsyncHandler(
  async (req, res, next) => {
    const email = emailSchema.parse(req.body.email);
    
  }
);
