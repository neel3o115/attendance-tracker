const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const subjectRoutes = require("./routes/subject.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// middlewares
app.use(cors());            
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);


// test route
app.get("/", (req,res) => {
    res.send("attendance tracker backend is running");
})

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    message: `route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

module.exports = app;