const mongoose = require("mongoose");

const attendanceEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    status: {
      type: String,
      enum: ["attended", "missed"],
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

 attendanceEntrySchema.index(
  { userId: 1, subjectId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("AttendanceEntry", attendanceEntrySchema);