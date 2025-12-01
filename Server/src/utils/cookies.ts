import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

const defaults: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
};

const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: fifteenMinutesFromNow(),
});

const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
  path: "/auth/refresh",
});

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

export const clearAuthCookie = ({res}: {res: Response}) =>
  res.clearCookie("accessToken").clearCookie("refreshToken", {
    path: "/auth/refresh",
  });
