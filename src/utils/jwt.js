const jwt = require("jsonwebtoken");

const COOKIE_NAME = "JWT_token";

const createJwt = (payload, expiresIn = "1d") =>
  jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });

const verifyJwt = (token) => jwt.verify(token, process.env.JWT_SECRET_KEY);

/**
 * The frontend and API are usually on different sites, so the session cookie is
 * SameSite=None + Secure by default (browsers also accept Secure cookies on http://localhost).
 * Override with COOKIE_SAMESITE / COOKIE_SECURE=false only if your setup needs it.
 */
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE !== "false",
  sameSite: process.env.COOKIE_SAMESITE || "none",
  path: "/",
});

const setAuthCookie = (res, token) =>
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: 24 * 60 * 60 * 1000 });

const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

const authenticate = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  try {
    const decoded = verifyJwt(token);
    // Verification tokens (signup / password reset) must never work as a session.
    if (decoded.purpose) throw new Error("Not a session token");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

module.exports = { createJwt, verifyJwt, authenticate, setAuthCookie, clearAuthCookie };
