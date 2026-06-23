const issuerModel = require("../models/issuer.model");

const getAllIssuers = (req, res) => {
  const issuers = issuerModel.getAll();
  res.json({ success: true, data: issuers });
};

const getIssuerById = (req, res) => {
  const { id } = req.params;
  const issuer = issuerModel.getById(id);
  if (!issuer) {
    return res.status(404).json({ success: false, error: `Issuer '${id}' not found` });
  }
  res.json({ success: true, data: issuer });
};

module.exports = { getAllIssuers, getIssuerById };
