const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorMiddleware = require('./middlewares/errors');
const ErrorHandler = require('./utils/errorHandler');
const app = express();

// Load env vars
dotenv.config({ path: './config/config.env' });

// Handling uncaught exception
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down due to uncaught exception`);
  process.exit(1);
});

// Connect Database
connectDB();

// Importing all routes
const jobs = require('./routes/jobs');
const auth = require('./routes/auth');
const user = require('./routes/user');

// Body Parser
app.use(express.json());

// Set cookie parser
app.use(cookieParser());

// Handle file uploads
app.use(fileUpload());

app.use('/api/v1/', jobs);
app.use('/api/v1/', auth);
app.use('/api/v1/', user);

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

// Middleware to handle errors
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `Server listening in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`
      .yellow.bold
  );
});

// Handling unhandled promise rejection
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(
    `Shutting down the server due to unhandled promise rejection.`
  );
  server.close(() => {
    process.exit(1);
  });
});
