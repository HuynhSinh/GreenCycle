import AppError from "../utils/AppError.js";

const formatIssuePath = (path = []) =>
  path
    .filter((segment) => !["body", "params", "query"].includes(segment))
    .join(".");

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = formatIssuePath(firstIssue?.path);
    const message = firstIssue?.message || "Invalid request payload";
    const error = new AppError(message, 400);
    error.details = result.error.issues.map((issue) => ({
      field: formatIssuePath(issue.path),
      message: issue.message,
    }));

    if (field) {
      error.field = field;
    }

    return next(error);
  }

  req.validated = result.data;
  next();
};
