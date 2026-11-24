const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const authRouter = require("./Routes/auth");
const rapRoutes = require("./Routes/rap");
const stockRoutes = require("./Routes/stock");
const jewelrystockRoutes = require("./Routes/jewelrystock");
const looseStockRoutes = require("./Routes/loosestock");
const partyRoutes = require("./Routes/party");

const app = express();
app.disable("x-powered-by");
// Behind Railway / Vercel / Nginx: trust the first proxy so req.ip is the real client.
app.set("trust proxy", 1);

/* ----------------------------------------------------------------- CORS */
// CORS_ORIGINS: comma-separated list, e.g. "https://superbdiamonds.in,http://localhost:3000".
// If unset, any origin is allowed (previous behaviour) — set it in production.
const allowList = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);
if (allowList.length === 0) {
  console.warn("[security] CORS_ORIGINS is not set: accepting credentialed requests from any origin.");
}
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowList.length === 0 || allowList.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

/* ----------------------------------------------------------------- Static frontend build */
const buildDir = path.join(__dirname, "..", "build");
app.use(express.static(buildDir));

/* ----------------------------------------------------------------- API */
app.get("/health", (req, res) =>
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" })
);
app.use("/auth", authRouter);
app.use("/stock", stockRoutes);
app.use("/loosestock", looseStockRoutes);
app.use("/jewelrystock", jewelrystockRoutes);
app.use("/rap", rapRoutes);
app.use("/party", partyRoutes);

/* ----------------------------------------------------------------- SPA fallback + 404 */
const indexHtml = path.join(buildDir, "index.html");
app.get("*", (req, res, next) => {
  if (req.accepts("html") && fs.existsSync(indexHtml)) return res.sendFile(indexHtml);
  next();
});
app.use((req, res) => res.status(404).json({ message: "Not found" }));

/* ----------------------------------------------------------------- Errors */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body" });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request is too large" });
  if (err.name === "MulterError") return res.status(400).json({ error: err.message });
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong" });
});

module.exports = app;
