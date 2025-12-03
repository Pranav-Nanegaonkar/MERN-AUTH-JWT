const AppError = require("../utilities/appError");

function getErrorLocation(stack) {
  if (!stack) return null;

  // Split the stack into lines
  const lines = stack.split("\n");

  // Find first line that includes .js or .ts file reference
  const relevantLine = lines.find(
    (line) => line.includes(".ts:") || line.includes(".js:")
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

const handleAppError = (res, error) => {
  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack:
      process.env.NODE_ENV === "development" ? getErrorLocation(error.stack) : undefined,
  });
};

exports.errorHander = (error, req, res, next) => {
  if (error instanceof AppError) {
    return handleAppError(res, error);
  }
  console.log(error.message);

  return res.status(500).json({
    status: "failure",
    message: "Internal Server Error",
    error_message: error.message,
    stack:
      process.env.NODE_ENV === "development"
        ? getErrorLocation(error.stack)
        : undefined,
  });
};
