const errorHandlingMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return; // Prevent double response
  }

  const status = error.statusCode || 500;

  if (process.env.MODE === "DEVELOPMENT") {
    return res.status(status).json({
      message: error.message,
      error,
      stack: error.stack,
    });
  }

  return res.status(status).json({
    success: false,
    message: error.message,
  });
};

export default errorHandlingMiddleware;
