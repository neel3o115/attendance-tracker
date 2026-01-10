const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const subjectRoutes = require("./routes/subject.routes");
const attendanceRoutes = require("./routes/attendance.routes");

const app = express();

// middlewares
app.use(cors());            
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);


// test route
app.get("/", (req,res) => {
    res.send("attendance tracker backend is running");
})

module.exports = app;