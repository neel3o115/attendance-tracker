const express = require("express");

const protect = require("../middleware/auth.middleware");
const Subject = require("../models/Subject");

const router = express.Router();

/**
 * POST /api/subjects
 * create a subject
 */
router.post("/", protect, async (req, res) => {
  try {
    const { name, minAttendance } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: "subject name is required" });
    }

    const subject = await Subject.create({
      userId: req.userId,
      name,
      minAttendance: minAttendance ?? 75,
    });

    return res.status(201).json({
      message: "subject created",
      subject,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

/**
 * GET /api/subjects
 * list all subjects of logged in user
 */
router.get("/", protect, async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ subjects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
