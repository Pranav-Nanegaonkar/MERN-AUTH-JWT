import VerificationCodeType from "../constants/verificationCodeTypes";
import SessionModel from "../models/session.model";
import VerificationCodeModel from "../models/verificationCode.model";
import {
  fiveMinutesAgo,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import UserModel from "../models/user.model";
import AppError from "../utils/AppError";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../constants/http";
import {
  accessTokenSignOptions,
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { sendMail } from "../utils/sendMail";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplate";
import { APP_ORIGIN } from "../constants/env";
import { hashValue } from "../utils/bcrypt";

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
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
  });

  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;

  // send verification email
  const { data: mailResponse, error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  if (error) {
    console.log("FAILED TO SEND MAIL: ", error);
  } else {
    console.log("EMAIL SENT: ", mailResponse);
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

  // const { password, ...userWithoutPassword } = user.toObject();

  // return user
  return {
    user: user.omitPassword(),
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

  // const { password, ...userWithoutPassword } = user.toObject();

  // return user
  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });

  if (!payload) {
    throw new AppError("Invalid refresh token", UNAUTHORIZED);
  }

  const session = await SessionModel.findById(payload.sessionId);

  if (session && session.expiresAt.getTime() < Date.now()) {
    console.log(session.expiresAt.getTime());
    console.log(Date.now());
    console.log(session.expiresAt.getTime() < Date.now());

    throw new AppError("Session Expired", UNAUTHORIZED);
  }

  if (!session) {
    throw new AppError("Session Expired", UNAUTHORIZED);
  }

  // refresh the session if it expires in the next 24 hours

  const sessionNeedsRefresh =
    session.expiresAt.getTime() - Date.now() <= 24 * 60 * 60 * 1000;

  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  const newRefreshToken = sessionNeedsRefresh
    ? signToken(
        {
          sessionId: session._id,
        },
        refreshTokenSignOptions
      )
    : undefined;

  const accessToken = signToken({
    userId: session.userId,
    sessionId: session._id,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const verifyEmail = async (code: string) => {
  //get verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });

  if (!validCode) {
    throw new AppError("Invalid or expired verification code", NOT_FOUND);
  }

  // update user to verifed true
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError("Failed to verify email", CONFLICT);
  }

  // delete verification code
  await validCode.deleteOne();

  // return user
  // const { password, ...newUser } = updatedUser.toObject();

  return {
    message: "User verified successfully",
    user: updatedUser.omitPassword(),
  };
};

export const sendPasswordResetEmail = async (email: string) => {
  // get the user by email
  const user = await UserModel.findOne({ email });

  if (!user) throw new AppError("User not found", NOT_FOUND);

  // check email rate limit
  const fiveMinAgo = fiveMinutesAgo();
  const count = await VerificationCodeModel.countDocuments({
    userId: user._id,
    type: VerificationCodeType.PasswordReset,
    createdAt: { $gt: fiveMinAgo },
  });

  if (!(count <= 1)) {
    throw new AppError(
      "Too many requests, please try again later",
      TOO_MANY_REQUESTS
    );
  }

  // create verification code
  const expiresAt = oneHourFromNow();
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.PasswordReset,
    expiresAt,
  });
  // send verification email
  const url = `${APP_ORIGIN}/password/reset?code=${
    verificationCode._id
  }&exp=${expiresAt.getTime()}`;

  const { data: mailResponse, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });

  if (!mailResponse?.id) {
    throw new AppError(
      `${error?.name} - ${error?.message}`,
      INTERNAL_SERVER_ERROR
    );
  }

  // return
  return {
    url,
    emailId: mailResponse.id,
  };
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({
  password,
  verificationCode,
}: ResetPasswordParams) => {
  //get the verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });
  if (!validCode) {
    throw new AppError("Invalid or expired verification code", NOT_FOUND);
  }
  //upgrade the verification code
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      password: await hashValue(password),
    },
    { new: true }
  );

  if (!updatedUser)
    throw new AppError("Failed to reset password", INTERNAL_SERVER_ERROR);

  //delete the verification code
  await validCode.deleteOne();
  //delete all sessions

  await SessionModel.deleteMany({
    userId: updatedUser._id,
  });

  return {
    user: updatedUser.omitPassword(),
  };
};
