const express = require("express");
const router  = express.Router();
const {
  createVerificationRequest,
  getVerificationStatus,
  handleCallback,
} = require("../controllers/verification.controller");

router.post("/request",           createVerificationRequest);
router.get("/status/:requestId",  getVerificationStatus);
router.get("/callback",           handleCallback);

module.exports = router;
