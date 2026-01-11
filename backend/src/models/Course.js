const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    minAttendance: {
      type: Number,
      required: true,
      default: 75,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// unique course name per user
courseSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Course", courseSchema);
