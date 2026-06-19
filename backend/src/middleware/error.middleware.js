const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.retryAfter && { retryAfter: err.retryAfter }),
    ...(err.attemptsLeft !== undefined && { attemptsLeft: err.attemptsLeft }),
    ...(err.action && { action: err.action }),
  });
};

export default errorHandler;
