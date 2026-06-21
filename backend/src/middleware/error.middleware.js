const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

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
