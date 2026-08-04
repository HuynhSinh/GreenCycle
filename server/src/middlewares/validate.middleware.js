import AppError from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue?.path?.join(".");
    const detail = [path, firstIssue?.message].filter(Boolean).join(": ");

    return next(new AppError(detail || "Invalid request payload", 400));
  }

  req.validated = result.data;
  next();
};
