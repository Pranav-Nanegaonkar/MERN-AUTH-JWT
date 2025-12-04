import expressAsyncHandler from "express-async-handler";
import UserModel from "../models/user.model";
import { OK } from "../constants/http";

export const getUserHandler = expressAsyncHandler(async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const user = await UserModel.findById(req.userId);

  res.status(OK).json(user?.omitPassword());
});


