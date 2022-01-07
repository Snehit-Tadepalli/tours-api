const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid input: '${err.path} = ${err.value}' is incorrect`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: '${err.keyValue.name}' Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data: '${errors.join(' & ')}'`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  const message = `Invalid token! Please login again.`;
  return new AppError(message, 401);
};

const handleJWTExpiredError = (err) => {
  const message = `Your token has expired! Please login again.`;
  return new AppError(message, 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
  } else {
    console.error(`Some unexpected error 🔥`, err);
    res
      .status(500)
      .json({ status: `Error`, message: `Something went very wrong!` });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Internal Error';

  if (process.env.NODE_ENV === `development`) sendErrorDev(err, res);
  if (process.env.NODE_ENV === `production`) {
    if (err.name === `CastError`) sendErrorProd(handleCastErrorDB(err), res);
    if (err.code === 11000) sendErrorProd(handleDuplicateFieldsDB(err), res);
    if (err.name === `ValidationError`)
      sendErrorProd(handleValidationErrorDB(err), res);
    if (err.name === `JsonWebTokenError`)
      sendErrorProd(handleJWTError(err), res);
    if (err.name === `TokenExpiredError`)
      sendErrorProd(handleJWTExpiredError(err), res);
  }
  next();
};
