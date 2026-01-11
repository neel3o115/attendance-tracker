const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  // mongoose invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ message: "invalid id" });
  }

  // mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // mongo duplicate key error
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    return res.status(409).json({
      message: "duplicate value",
      field: keys[0] || "unknown",
    });
  }

  // fallback
  return res.status(500).json({ message: "server error" });
};

module.exports = errorHandler;