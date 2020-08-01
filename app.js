const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/db');
const app = express();

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect Database
connectDB();

// Importing all routes
const jobs = require('./routes/jobs');

app.use('/api/v1/', jobs);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server listening in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`
      .yellow.bold
  );
});
