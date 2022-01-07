const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');
const homeRouter = require('./routes/homeRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Functions for middleware
const addRequestTime = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  req.requestTime = new Date().toISOString();
  next();
};

// Middleware's
app.use(addRequestTime);
if (process.env.NODE_ENV === `development`) app.use(morgan(`dev`));
app.use(express.json());
// app.use(express.static(`${__dirname}/public`));

// Routers
app.use(`/`, homeRouter);
app.use(`/api/v1/tours`, tourRouter);
app.use(`/api/v1/tours/:id`, tourRouter);
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/users/:id`, userRouter);

// Code reaches here if user made a bad request.
app.all(`*`, (req, res, next) => {
  next(new AppError(`Can't reach ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
