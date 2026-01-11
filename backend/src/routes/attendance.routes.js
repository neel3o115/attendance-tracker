const express = require("express");
const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const protect = require("../middleware/auth.middleware");
const Subject = require("../models/Subject");
const AttendanceEntry = require("../models/AttendanceEntry");

const router = express.Router();

/**
 * POST /api/attendance/mark
 * body: { subjectId, status }
 * status: "attended" | "missed"
 */
router.post("/mark", protect, asyncHandler(async (req, res) => {
    const { subjectId, status, date } = req.body || {};

    if (!subjectId || !status) {
      return res.status(400).json({
        message: "subjectId and status are required",
      });
    }

    if (!["attended", "missed"].includes(status)) {
      return res.status(400).json({
        message: "status must be either attended or missed",
      });
    }

    // validate + normalize date (IMPORTANT)
    const d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) {
      return res.status(400).json({ message: "invalid date format" });
    }
    d.setHours(0, 0, 0, 0); // normalize to start of day

    // ensure subject belongs to this user
    const subject = await Subject.findOne({ _id: subjectId, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ message: "subject not found" });
    }

    // create entry
    const entry = await AttendanceEntry.findOneAndUpdate(
        {
            userId: req.userId,
            subjectId,
            date: d,
        },
        {
            $set: { status },
        },
        {
            new: true,     // return updated document
            upsert: true,  // create if not exists
        }
    );

    return res.status(201).json({
      message: "attendance marked",
      entry,
    });
  })
);

/**
 * DELETE /api/attendance/undo/:subjectId
 * undo the latest attendance mark for a subject
 */
router.delete("/undo/:subjectId", protect, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // ensure subject belongs to this user
    const subject = await Subject.findOne({ _id: subjectId, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ message: "subject not found" });
    }

    // find latest attendance entry
    const latest = await AttendanceEntry.findOne({
      userId: req.userId,
      subjectId,
    }).sort({ createdAt: -1 });

    if (!latest) {
      return res.status(404).json({ message: "no attendance entries to undo" });
    }

    await AttendanceEntry.deleteOne({ _id: latest._id });

    return res.status(200).json({
      message: "last attendance undone ✅",
      deletedEntry: latest,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * GET /api/attendance/summary
 * returns dashboard stats per subject
 */
router.get("/summary", protect, async (req, res) => {
  try {
    const { courseId } = req.query;

    // subject filter
    const subjectFilter = { userId: req.userId };
    if (courseId) subjectFilter.courseId = courseId;

    const subjects = await Subject.find(subjectFilter).sort({
      createdAt: -1,
    });

    const subjectIds = subjects.map((s) => s._id);

    // aggregate attendance counts by subjectId (only for selected subjects)
    const stats = await AttendanceEntry.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          subjectId: { $in: subjectIds },
        },
      },
      {
        $group: {
          _id: "$subjectId",
          total: { $sum: 1 },
          attended: {
            $sum: {
              $cond: [{ $eq: ["$status", "attended"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // convert stats array -> map for O(1) lookup
    const map = new Map();
    for (const s of stats) {
      map.set(String(s._id), {
        total: s.total,
        attended: s.attended,
        missed: s.total - s.attended,
      });
    }

    const results = subjects.map((subject) => {
      const subjectStats = map.get(String(subject._id)) || {
        total: 0,
        attended: 0,
        missed: 0,
      };

      const { total, attended, missed } = subjectStats;

      const minAttendance = subject.minAttendance;
      const p = minAttendance / 100;

      const attendancePercent = total === 0 ? 0 : (attended / total) * 100;

      // required classes to reach criteria
      let classesNeededToReach = 0;
      if (total > 0 && attendancePercent + 1e-9 < minAttendance) {
        const x = (p * total - attended) / (1 - p);
        classesNeededToReach = Math.max(0, Math.ceil(x));
      }

      // leaves available
      let leavesAvailable = 0;
      if (total > 0 && attendancePercent + 1e-9 >= minAttendance) {
        const L = (attended - p * total) / p;
        leavesAvailable = Math.max(0, Math.floor(L));
      }

      return {
        subjectId: subject._id,
        courseId: subject.courseId, // helpful for frontend
        name: subject.name,
        minAttendance,
        total,
        attended,
        missed,
        attendancePercent: Number(attendancePercent.toFixed(2)),
        classesNeededToReach,
        leavesAvailable,
      };
    });

    return res.status(200).json({ subjects: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * GET /api/attendance/subject/:subjectId
 * get attendance history for a subject (latest first)
 */
router.get("/subject/:subjectId", protect, async (req, res) => {
  try {
    const { subjectId } = req.params;

    // ensure subject belongs to this user
    const subject = await Subject.findOne({ _id: subjectId, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ message: "subject not found" });
    }

    const entries = await AttendanceEntry.find({
      userId: req.userId,
      subjectId,
    }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      subject: {
        id: subject._id,
        name: subject.name,
        minAttendance: subject.minAttendance,
      },
      entries,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * DELETE /api/attendance/entry/:entryId
 * delete a specific attendance entry
 */
router.delete("/entry/:entryId", protect, async (req, res) => {
  try {
    const { entryId } = req.params;

    const entry = await AttendanceEntry.findOne({
      _id: entryId,
      userId: req.userId,
    });

    if (!entry) {
      return res.status(404).json({ message: "attendance entry not found" });
    }

    await AttendanceEntry.deleteOne({ _id: entryId });

    return res.status(200).json({
      message: "attendance entry deleted ✅",
      deletedEntry: entry,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});


module.exports = router;
