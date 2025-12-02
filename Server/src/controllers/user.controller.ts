import expressAsyncHandler from "express-async-handler";
import UserModel from "../models/user.model";
import { OK } from "../constants/http";

export const getUserHandler = expressAsyncHandler(async (req, res, next) => {
  //@ts-ignore
  const user = await UserModel.findById(req.userId);

  res.status(OK).json(user?.omitPassword());
});


