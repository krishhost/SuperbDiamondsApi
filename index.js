require("dotenv").config();
// const functions = require("firebase-functions");//activate when firebase is in use

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./src/Routes/auth");
const rapRoutes = require("./src/Routes/rap");
const stockRoutes = require("./src/Routes/stock");
const looseStockRoutes = require("./src/Routes/loosestock");
const path = require("path");
const db = require("./src/DB/connect");

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.static(path.join(__dirname, "build")));
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: true,
  credentials: true, // Allow cookies to be sent
  allowedHeaders: ["Content-Type", "Authorization"], // Add any other headers you may need
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));

// This will ensure OPTIONS requests are handled properly for preflight checks
app.options("*", cors(corsOptions));

// DB connection
const start = async () => {
  try {
    await db.connectDB(process.env.MONGO_URI);
  } catch (error) {
    console.log(`Sorry, connection error! ${error}`);
  }
};
start();
//url/home

app.use("/auth", authRouter);
app.use("/stock", stockRoutes);
app.use("/loosestock", looseStockRoutes);
app.use("/rap", rapRoutes);
// app.use("/party", PartyRoutes);
// app.use("/broker", BrokerRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express is running on Port ${PORT}!`);
});

// exports.api = functions.https.onRequest(app); //activate this instead of upper server listen code if want to go for firebase.
