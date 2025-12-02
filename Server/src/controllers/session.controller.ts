import expressAsyncHandler from "express-async-handler";
import SessionModel from "../models/session.model";
import { BAD_REQUEST, CONFLICT, NOT_FOUND, OK } from "../constants/http";
import AppError from "../utils/AppError";
import { NODE_ENV } from "../constants/env";
import z from "zod";

export const getSessionHandler = expressAsyncHandler(async (req, res) => {
  const sessions = await SessionModel.find(
    {
      //@ts-ignore
      userId: req.userId,
      expiresAt: { $gt: Date.now() },
    },
    { _id: 1, userAgent: 1, createdAt: 1 },
    {
      sort: { createdAt: -1 },
    }
  );

  res.status(OK).json(sessions);
});

export const deleteSessionHandler = expressAsyncHandler(async (req, res) => {
  const id = z.string().parse(req.params.id);

  if (!id) throw new AppError("sessionId must be provided", BAD_REQUEST);

  const session = await SessionModel.findByIdAndDelete(id);

  if (!session) throw new AppError("Session not found", NOT_FOUND);

  console.log(session);

  res.status(OK).json({ message: "Session deleted" });
});
