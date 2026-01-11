const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const protect = require("../middleware/auth.middleware");
const Course = require("../models/Course");
const Subject = require("../models/Subject");
const AttendanceEntry = require("../models/AttendanceEntry");

const router = express.Router();

/**
 * POST /api/subjects
 * create a subject
 */
router.post("/", protect, async (req, res) => {
  try {
    const { courseId, name, minAttendance } = req.body || {};

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    if (!name) {
      return res.status(400).json({ message: "subject name is required" });
    }

    const course = await Course.findOne({ _id: courseId, userId: req.userId });
    if (!course) {
      return res.status(404).json({ message: "course not found" });
    }

    const subject = await Subject.create({
      userId: req.userId,
      courseId,
      name,
      minAttendance: minAttendance ?? 75,
    });

    return res.status(201).json({
      message: "subject created",
      subject,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "subject with same name already exists" });
    }
  
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * GET /api/subjects
 * list all subjects of logged in user
 */
router.get("/", protect, asyncHandler(async (req, res) => {
    const subjects = await Subject.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ subjects });
  })
);


/**
 * DELETE /api/subjects/:id
 * delete subject + all attendance entries of it
 */
router.delete("/:id", protect, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subject = await Subject.findOne({ _id: id, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ message: "subject not found" });
    }

    const deletedEntries = await AttendanceEntry.deleteMany({
      userId: req.userId,
      subjectId: id,
    });

    await Subject.deleteOne({ _id: id });

    return res.status(200).json({
      message: "subject deleted ✅",
      deletedAttendanceCount: deletedEntries.deletedCount,
    });
  })
);


/**
 * PATCH /api/subjects/:id
 * update subject (name and/or minAttendance)
 */
router.patch("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, minAttendance } = req.body || {};

    const subject = await Subject.findOne({ _id: id, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ message: "subject not found" });
    }

    if (name !== undefined) {
      const cleaned = name.trim();
      if (!cleaned) {
        return res.status(400).json({ message: "subject name cannot be empty" });
      }
      subject.name = cleaned; // schema will lowercase it
    }

    if (minAttendance !== undefined) {
      if (typeof minAttendance !== "number") {
        return res.status(400).json({ message: "minAttendance must be a number" });
      }
      if (minAttendance < 0 || minAttendance > 100) {
        return res.status(400).json({ message: "minAttendance must be between 0 and 100" });
      }
      subject.minAttendance = minAttendance;
    }

    await subject.save();

    return res.status(200).json({
      message: "subject updated",
      subject,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "subject with same name already exists" });
    }

    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});




module.exports = router;
