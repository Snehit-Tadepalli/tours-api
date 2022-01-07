class AppError extends Error {
  statusCode;
  status;
  isOperational;

  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? `Fail` : `Error`;
    this.isOperational = true;

    // The below line is a static method of Error class which provides us the stackTrace for this object
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
