const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // header should be like: "Bearer <token>"
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "no token provided" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({ message: "invalid or expired token" });
  }
};

module.exports = protect;
