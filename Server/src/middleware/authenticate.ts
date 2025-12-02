import { RequestHandler } from "express";
import AppError from "../utils/AppError";
import { UNAUTHORIZED } from "../constants/http";
import { verifyToken } from "../utils/jwt";

export const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;

  if (!accessToken) throw new AppError("Not Authorized", UNAUTHORIZED);

  const { error, payload } = verifyToken(accessToken);

  if (!payload) {
    throw new AppError(
      error === "jwt expired" ? "Token expired" : "Invlid Token",
      UNAUTHORIZED
    );
  }
  //@ts-ignore
  req.userId = payload.userId;
  //@ts-ignore
  req.sessionId = payload.sessionId;

  next();
};
