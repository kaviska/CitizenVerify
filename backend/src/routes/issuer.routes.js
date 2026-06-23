const express = require("express");
const router = express.Router();
const { getAllIssuers, getIssuerById } = require("../controllers/issuer.controller");

// GET /api/issuers
router.get("/", getAllIssuers);

// GET /api/issuers/:id
router.get("/:id", getIssuerById);

module.exports = router;
