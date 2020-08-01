const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_LOCAL_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    console.log(
      `MongoDB Database connected with host: ${conn.connection.host}`
        .green.bold.underline
    );
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = connectDB;
