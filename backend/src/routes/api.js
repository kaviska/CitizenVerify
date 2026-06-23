const express = require("express");
const router = express.Router();

const issuerRoutes = require("./issuer.routes");
const verificationRoutes = require("./verification.routes");

// Health check
router.get("/health", (req, res) => {
  res.json({ success: true, message: "GovVerify API is running", timestamp: new Date().toISOString() });
});

router.use("/issuers", issuerRoutes);
router.use("/verification", verificationRoutes);

module.exports = router;
