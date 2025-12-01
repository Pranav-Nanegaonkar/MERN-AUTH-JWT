import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import z from "zod";
import AppError from "../utils/AppError";
import { NODE_ENV } from "../constants/env";

function getErrorLocation(stack: string | undefined) {
  if (!stack) return null;

  // Split the stack into lines
  const lines = stack.split("\n");

  // Find first line that includes .js or .ts file reference
  const relevantLine = lines.find((line) =>
    line.includes(".ts:") || line.includes(".js:")
  );

  if (!relevantLine) return null;

  // Extract file, line & column
  const match =
    relevantLine.match(/\((.*\.(ts|js)):(\d+):(\d+)\)/) ||
    relevantLine.match(/at (.*\.(ts|js)):(\d+):(\d+)/);

  if (!match) return null;

  return {
    file: match[1],
    line: match[3],
    column: match[4],
  };
}


const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
  return res.status(BAD_REQUEST).json({
    message: error.message,
    errors,
    stack:
      NODE_ENV === "development" ? getErrorLocation(error.stack) : undefined,
  });
};

const handleAppError = (res: Response, error: AppError) => {
  return res.status(error.statusCode as number).json({
    status: error.status,
    message: error.message,
    stack:
      NODE_ENV === "development" ? getErrorLocation(error.stack) : undefined,
  });
};

const errorHandler: ErrorRequestHandler = async (error, req, res, next) => {
  console.log(`PATH: ${req.path}`, error);

  if (error instanceof z.ZodError) {
    return handleZodError(res, error);
  }

  if (error instanceof AppError) {
    return handleAppError(res, error);
  }

  return res.status(INTERNAL_SERVER_ERROR).json({
    status: "failure",
    message: "Internal Server Error",
    stack:
      NODE_ENV === "development" ? getErrorLocation(error.stack) : undefined,
  });
};
export default errorHandler;
