import { config } from "../config/index.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal server error";

  if (!err.isOperational && config.nodeEnv !== "test") {
    console.error(err);
  }

  res.status(statusCode).json({ message });
}
