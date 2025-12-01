import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";
import errorHandler from "./middleware/errorHandler";
import { OK } from "./constants/http";
import authRoutes from "./routes/auth.routes";
import connectToDatabase from "./config/db";

connectToDatabase();

const app = express();

app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

app.get("/health", (req, res, next) => {
  // next(new AppError("test error", 400));

  res.status(OK).json({
    status: "success",
  });
});

app.use("/auth", authRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `-------------------Server is running on ${PORT} in ${NODE_ENV} enviroment-------------------`
  );
});
