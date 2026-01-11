const express = require("express");
const mongoose = require("mongoose");

const protect = require("../middleware/auth.middleware");
const Course = require("../models/Course");
const Subject = require("../models/Subject");
const AttendanceEntry = require("../models/AttendanceEntry");

const router = express.Router();

/**
 * POST /api/courses
 * create course
 */
router.post("/", protect, async (req, res) => {
  try {
    const { name, minAttendance } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: "course name is required" });
    }

    const course = await Course.create({
      userId: req.userId,
      name: name.trim(),
      minAttendance: minAttendance ?? 75,
    });

    return res.status(201).json({
      message: "course created",
      course,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "course with same name already exists" });
    }
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * GET /api/courses
 * list all courses for user
 */
router.get("/", protect, async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ courses });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

// GET /api/courses/:courseId/summary
router.get("/:courseId/summary", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({ _id: courseId, userId: req.userId });
    if (!course) {
      return res.status(404).json({ message: "course not found" });
    }

    // subjects in this course
    const subjects = await Subject.find({ userId: req.userId, courseId }).sort({ createdAt: -1 });

    const subjectIds = subjects.map((s) => s._id);

    // overall aggregation for this course (across all its subjectIds)
    const overallAgg = await AttendanceEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          subjectId: { $in: subjectIds },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          attended: {
            $sum: { $cond: [{ $eq: ["$status", "attended"] }, 1, 0] },
          },
        },
      },
    ]);

    const overallCounts = overallAgg[0] || { total: 0, attended: 0 };
    const total = overallCounts.total;
    const attended = overallCounts.attended;
    const missed = total - attended;

    const minAttendance = course.minAttendance;
    const p = minAttendance / 100;
    const attendancePercent = total === 0 ? 0 : (attended / total) * 100;

    let classesNeededToReach = 0;
    if (total > 0 && attendancePercent + 1e-9 < minAttendance) {
      const x = (p * total - attended) / (1 - p);
      classesNeededToReach = Math.max(0, Math.ceil(x));
    }

    let leavesAvailable = 0;
    if (total > 0 && attendancePercent + 1e-9 >= minAttendance) {
      const L = (attended - p * total) / p;
      leavesAvailable = Math.max(0, Math.floor(L));
    }

    return res.status(200).json({
      course: {
        id: course._id,
        name: course.name,
        minAttendance: course.minAttendance,
      },
      overall: {
        total,
        attended,
        missed,
        attendancePercent: Number(attendancePercent.toFixed(2)),
        classesNeededToReach,
        leavesAvailable,
      },
      subjects: subjects.map((s) => ({
        subjectId: s._id,
        name: s.name,
        minAttendance: s.minAttendance,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * DELETE /api/courses/:courseId
 * delete course + all its subjects + all attendance entries of those subjects
 */
router.delete("/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findOne({ _id: courseId, userId: req.userId });
    if (!course) {
      return res.status(404).json({ message: "course not found" });
    }

    // find subjects in this course
    const subjects = await Subject.find({ userId: req.userId, courseId }).select("_id");
    const subjectIds = subjects.map((s) => s._id);

    // delete attendance entries for these subjects
    const deletedAttendance = await AttendanceEntry.deleteMany({
      userId: req.userId,
      subjectId: { $in: subjectIds },
    });

    // delete subjects
    const deletedSubjects = await Subject.deleteMany({
      userId: req.userId,
      courseId,
    });

    // delete course
    await Course.deleteOne({ _id: courseId });

    return res.status(200).json({
      message: "course deleted ✅",
      deletedSubjectsCount: deletedSubjects.deletedCount,
      deletedAttendanceCount: deletedAttendance.deletedCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});


module.exports = router;
