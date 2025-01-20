const express = require("express");
const { SignUp, LogIn, GetUser, Verify } = require("../Controller/auth");
const { authenticate } = require("../utils/jwt");

const router = express.Router();

router.post("/signup", SignUp);
router.post("/login", LogIn);
router.post("/verify", Verify);

router.use(authenticate);
router.get("/user-details/:identifier", GetUser);

module.exports = router;
