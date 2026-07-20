import AppError from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
  return next(new AppError("Invalid request payload", 400));
  }

  req.validated = result.data;
  next();
};
