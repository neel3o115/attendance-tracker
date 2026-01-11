const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("mongodb connected");

    await mongoose.connection.db.collection("subjects").createIndex(
      { userId: 1, name: 1 },
      { unique: true }
    );
    console.log("subjects unique index ensured");
  } catch (err) {
    console.log("mongodb connection failed");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;