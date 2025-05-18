const asyncHandler = (fn) => {
  return (req, res, next) => {
    return fn(req, res, next).catch((error) => {
      error.cause = 500;
      return next(error);
    });
  };
};
export default asyncHandler;
