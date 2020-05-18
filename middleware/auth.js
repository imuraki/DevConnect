const config = require("config");
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token)
    return res.status(401).json({ msg: "No toen, authorization denied" });

  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(400).json({ msg: "Token not valid" });
  }
};
