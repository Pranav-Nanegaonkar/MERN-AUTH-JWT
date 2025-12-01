import { sign, SignOptions, VerifyOptions } from "jsonwebtoken";
import { SessionDocument } from "../models/session.model";
import { UserDocument } from "../models/user.model";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import AppError from "./AppError";

export type RefreshTokenPayload = {
  sessionId: SessionDocument["_id"];
};

export type AccessTokenPayload = {
  userId: UserDocument["_id"];
  sessionId: SessionDocument["_id"];
};

type SignOptionsAndSecret = SignOptions & { secret: string };

const defaults: SignOptions = {
  audience: ["user"],
};

export const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "15m",
  secret: JWT_SECRET,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "30d",
  secret: JWT_REFRESH_SECRET,
};

export const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  options?: SignOptionsAndSecret
) => {
  const { secret, ...signOptions } = options || accessTokenSignOptions;

  return jwt.sign(payload, secret, {
    ...defaults,
    ...signOptions,
  });
};

export const verifyToken = <Tpayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & { secret: string }
) => {
  const { secret = JWT_SECRET, ...verifyOptions } = options || {};

  try {
    const payload = jwt.verify(token, secret, (error, payload) => {
      if (error) throw new AppError("Invalid token", 401);
      return payload;
    });
    return {
      payload,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};
