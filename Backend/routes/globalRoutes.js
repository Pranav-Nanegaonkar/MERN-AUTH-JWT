const express = require("express");

const router = express.Router();

router.post(
  "/auth/register",
  require("../services/auth services/login.service").register
);

module.exports = router;
