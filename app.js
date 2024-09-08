const express = require('express');
const xss = require('xss-clean');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
app.use(morgan('dev'));

//  GLOBAL MIDDLEWARES

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// security http headers
app.use(helmet());
// api limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this ip. please try again in an hour',
});
app.use('/api', limiter);
// body parser in to req.body > we can pass options obj in json for example input size limit
app.use(express.json({ limit: '10kb' }));
// data sanitization against NOSQL query injection
app.use(mongoSanitize());
// data sanitization again crosssite scrypting attacks
app.use(xss());
// prevent parameter pollution
app.use(
  hpp({
    whitelist: 'duration',
  }),
);

// serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toString();
  console.log(req.requestTime);
  next();
});
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRoutes);

// handler for all http methods
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ERROR (GLOBAL) HANDLING MIDDLEWARE. THIS TAKES IN 4 ARGS.EXPRESS RECOGNIZES  THIS MIDDLEWARE FUNC BY THE 4 ARGS
app.use(globalErrorHandler);

module.exports = app;

// Rough HERE

app.use((req, res, next) => {
  console.log('Hello From MiddleWare 🫠');
  next();
});

// app.use((req, res, next) => {
//   console.log('Hello From MiddleWare 🫠');
//   next();
// });
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();

//   // console.log('Hello From MiddleWare 🫠');
//   next();
// });

// ROUTE HANDLERS

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);

// -- routing is configuring how a server/application should response to certain http request

// app.get("/", (req, res) => {
//   res.status(404).json({ message: "Hello from server", app: "Natours" });
// });

// app.post("/", (req, res) => {
//   res.status(200).json({ msg: "response posted" });
// });
