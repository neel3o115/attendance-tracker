const express = require("express");

const protect = require("../middleware/auth.middleware");
const Subject = require("../models/Subject");
const AttendanceEntry = require("../models/AttendanceEntry");

const router = express.Router();

/**
 * POST /api/attendance/mark
 * body: { subjectId, status }
 * status: "attended" | "missed"
 */
router.post("/mark", protect, async (req, res) => {
  try {
    const { subjectId, status } = req.body || {};

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

    // ensure subject belongs to this user
    const subject = await Subject.findOne({ _id: subjectId, userId: req.userId });
    if (!subject) {
      return res.status(404).json({ message: "subject not found" });
    }

    const entry = await AttendanceEntry.create({
      userId: req.userId,
      subjectId,
      status,
      date: new Date(),
    });

    return res.status(201).json({
      message: "attendance marked",
      entry,
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
    // get user's subjects
    const subjects = await Subject.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    const results = [];

    for (const subject of subjects) {
      const total = await AttendanceEntry.countDocuments({
        userId: req.userId,
        subjectId: subject._id,
      });

      const attended = await AttendanceEntry.countDocuments({
        userId: req.userId,
        subjectId: subject._id,
        status: "attended",
      });

      const missed = total - attended;

      const minAttendance = subject.minAttendance; // like 75
      const p = minAttendance / 100;

      const attendancePercent = total === 0 ? 0 : (attended / total) * 100;

      // classes needed to reach criteria
      let classesNeededToReach = 0;
      if (total > 0 && attendancePercent + 1e-9 < minAttendance) {
        const x = (p * total - attended) / (1 - p);
        classesNeededToReach = Math.max(0, Math.ceil(x));
      } else if (total === 0) {
        // if no classes yet, 0 needed technically
        classesNeededToReach = 0;
      }

      // leaves available
      let leavesAvailable = 0;
      if (total > 0 && attendancePercent + 1e-9 >= minAttendance) {
        const L = (attended - p * total) / p;
        leavesAvailable = Math.max(0, Math.floor(L));
      }

      results.push({
        subjectId: subject._id,
        name: subject.name,
        minAttendance,
        total,
        attended,
        missed,
        attendancePercent: Number(attendancePercent.toFixed(2)),
        classesNeededToReach,
        leavesAvailable,
      });
    }

    return res.status(200).json({ subjects: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
