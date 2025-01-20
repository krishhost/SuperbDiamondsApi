const jwt = require("jsonwebtoken");

const createJwt = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });
};

const authenticate = (req, res, next) => {
  const token = req.cookies.JWT_token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decodedToken;
    console.log("Authenticated success");
    next();
  } catch (error) {
    console.log("error", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { createJwt, authenticate };
