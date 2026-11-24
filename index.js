require("dotenv").config();
// const functions = require("firebase-functions"); // activate when Firebase is in use

const app = require("./src/app");
const db = require("./src/DB/connect");

const PORT = process.env.PORT || 4001;

if (!process.env.JWT_SECRET_KEY) {
  console.error("JWT_SECRET_KEY is not set. Refusing to start without it.");
  process.exit(1);
}

db.connectDB(process.env.MONGO_URI);

// Listen when run directly (node index.js). When imported (e.g. by Vercel) just export the app.
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express is running on Port ${PORT}!`);
  });
}

module.exports = app;
// exports.api = functions.https.onRequest(app); // activate this instead of app.listen for Firebase.
