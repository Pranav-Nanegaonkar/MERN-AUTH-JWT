import expressAsyncHandler from "express-async-handler";
import {  Request, Response } from "express";
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
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.service";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import AppError from "../utils/AppError";

export const registerHandler = expressAsyncHandler(async (req, res) => {
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

export const loginHandler = expressAsyncHandler(async (req, res) => {
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

export const logoutHandler = expressAsyncHandler(async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const resultPayload = verifyToken(accessToken) as {
    payload?: { sessionId?: string };
  };
  if (resultPayload.payload && "sessionId" in resultPayload.payload) {
    console.log(resultPayload.payload.sessionId);

    await SessionModel.findByIdAndDelete(resultPayload.payload.sessionId);
  }

  clearAuthCookie(res).json({
    message: "Logout successful",
  });
});

export const refreshHandler = expressAsyncHandler(async (req, res) => {
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
  async (req: Request, res: Response) => {
    const verificationCode = verificationCodeSchema.parse(req.params.code);

    // call service

    const { user } = await verifyEmail(verificationCode);

    res.json(user);
  }
);

export const sendPasswordRestHandler = expressAsyncHandler(
  async (req, res) => {
    const email = emailSchema.parse(req.body.email);

     await sendPasswordResetEmail(email);

    res.status(OK).json({
      message: "Password reset email sent",
    });
  }
);

export const restPasswordHandler = expressAsyncHandler(
  async (req, res: Response) => {
    const request = resetPasswordSchema.parse(req.body);

    //call service

    await resetPassword(request);

    clearAuthCookie(res).status(OK).json({
      message: "Password reset successfully",
    });
  }
);
