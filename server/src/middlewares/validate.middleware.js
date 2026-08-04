import AppError from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");

    return next(
      new AppError(
        details
          ? `Invalid request payload: ${details}`
          : "Invalid request payload",
        400,
      ),
    );
  }

  req.validated = result.data;
  next();
};
