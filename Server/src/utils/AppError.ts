export default class AppError extends Error {
  statusCode: number | string;
  status: string;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "failure" : "error";

    // Prevent this class from appearing in the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
