class AppError extends Error {
  statusCode;
  status;

  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "failure" : "error";

    // Prevent this class from appearing in the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
