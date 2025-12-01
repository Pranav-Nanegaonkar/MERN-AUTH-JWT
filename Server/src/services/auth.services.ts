import VerificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import VerificationCodeModel from "../models/verificationCode.model";
import { oneYearFromNow } from "../utils/date";
import UserModel from "../models/user.model";
import AppError from "../utils/AppError";
import { UNAUTHORIZED } from "../constants/http";
import {
  accessTokenSignOptions,
  refreshTokenSignOptions,
  signToken,
} from "../utils/jwt";

export type CreateAccountsParms = {
  email: string;
  password: string;
  userAgent?: string;
};

export const createAccount = async (data: CreateAccountsParms) => {
  //verify if already exist
  const existingUser = await UserModel.exists({ email: data.email });
  if (existingUser) {
    throw new AppError("User already exists", 400);
  }

  //if not exist then crate user
  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  // create verificaiton code
  const verifiactionCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });

  // send verification email

  // create session
  const session = await SessionModel.create({
    userId: user._id,
    userAgent: data.userAgent,
  });

  // sign access token and refresh token
  // const refreshToken = jwt.sign(
  //   {
  //     sessionId: session._id,
  //   },
  //   JWT_REFRESH_SECRET,
  //   { audience: ["user"], expiresIn: "30d" }
  // );

  // const accessToken = jwt.sign(
  //   { userId: user._id, sessionId: session._id },
  //   JWT_SECRET,
  //   { audience: ["user"], expiresIn: "15m" }
  // );

  const refreshToken = signToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions
  );

  const accessToken = signToken(
    {
      userId: user._id,
      sessionId: session._id,
    },
    accessTokenSignOptions
  );

  const { password, ...userWithoutPassword } = user.toObject();

  // return user
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (data: CreateAccountsParms) => {
  // find user by email
  const user = await UserModel.findOne({ email: data.email });

  if (!user) {
    throw new AppError("Invalid credentials", UNAUTHORIZED);
  }

  // verify password
  const isPasswordValid = await user?.comparePassword(data.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", UNAUTHORIZED);
  }

  // create session
  const session = await SessionModel.create({
    userId: user._id,
    userAgent: data.userAgent,
  });

  // sign access token and refresh token
  // const refreshToken = jwt.sign(
  //   {
  //     sessionId: session._id,
  //   },
  //   JWT_REFRESH_SECRET,
  //   { audience: ["user"], expiresIn: "30d" }
  // );

  // const accessToken = jwt.sign(
  //   { userId: user._id, sessionId: session._id },
  //   JWT_SECRET,
  //   { audience: ["user"], expiresIn: "15m" }
  // );

  const refreshToken = signToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions
  );

  const accessToken = signToken(
    {
      userId: user._id,
      sessionId: session._id,
    },
    accessTokenSignOptions
  );

  const { password, ...userWithoutPassword } = user.toObject();

  // return user
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};
