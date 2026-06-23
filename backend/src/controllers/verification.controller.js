const config              = require("../../config");
const verificationService = require("../services/verification.service");

// ─── POST /api/verification/request ───────────────────────────────────────

const createVerificationRequest = async (req, res) => {
  const { issuerId, claimIds } = req.body;
  console.log(`[CONTROLLER:createVerificationRequest] issuerId="${issuerId}" claimIds=${JSON.stringify(claimIds)}`);

  if (!issuerId || typeof issuerId !== "string") {
    console.warn(`[CONTROLLER:createVerificationRequest] ✗ Validation failed: issuerId missing or not a string`);
    return res.status(400).json({ success: false, error: "issuerId is required" });
  }
  if (!Array.isArray(claimIds) || claimIds.length === 0) {
    console.warn(`[CONTROLLER:createVerificationRequest] ✗ Validation failed: claimIds is not a non-empty array`);
    return res.status(400).json({ success: false, error: "claimIds must be a non-empty array" });
  }

  try {
    const request = await verificationService.createRequest(issuerId, claimIds);
    console.log(`[CONTROLLER:createVerificationRequest] ✓ Created requestId="${request.requestId}" authorizeUrl starts with: ${String(request.authorizeUrl).slice(0, 60)}`);
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error(`[CONTROLLER:createVerificationRequest] ✗ Error:`, err.message);
    res.status(400).json({ success: false, error: err.message });
  }
};

// ─── GET /api/verification/status/:requestId ───────────────────────────────

const getVerificationStatus = async (req, res) => {
  const { requestId } = req.params;
  console.log(`[CONTROLLER:getVerificationStatus] requestId="${requestId}"`);

  try {
    const record = await verificationService.getRequestStatus(requestId);
    if (!record) {
      console.warn(`[CONTROLLER:getVerificationStatus] ✗ Not found: requestId="${requestId}"`);
      return res.status(404).json({ success: false, error: "Not found" });
    }
    console.log(`[CONTROLLER:getVerificationStatus] ✓ Returning status="${record.status}" for requestId="${requestId}"`);
    res.json({ success: true, data: record });
  } catch (err) {
    console.error(`[CONTROLLER:getVerificationStatus] ✗ Error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/verification/callback ───────────────────────────────────────

const handleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  console.log(`\n[CONTROLLER:handleCallback] Received Thunder callback`);
  console.log(`[CONTROLLER:handleCallback] state="${state}" code=${code ? code.slice(0, 8) + "…" : "MISSING"} error="${error ?? "none"}"`);

  if (error) {
    console.error(`[CONTROLLER:handleCallback] ✗ Thunder returned an error: "${error}"`);
    console.error(`[CONTROLLER:handleCallback]   This usually means the officer rejected or the session expired`);
    return res.redirect(`${config.frontendUrl}/verify?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error(`[CONTROLLER:handleCallback] ✗ No code in query — Thunder did not provide an auth code`);
    return res.status(400).send("Missing code");
  }

  if (!state) {
    console.error(`[CONTROLLER:handleCallback] ✗ No state in query — cannot match callback to a request`);
    return res.status(400).send("Missing state");
  }

  try {
    await verificationService.handleCallback(code, state);
    const redirectUrl = `${config.frontendUrl}/verify?requestId=${state}`;
    console.log(`[CONTROLLER:handleCallback] ✓ Callback handled — redirecting to ${redirectUrl}`);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error(`[CONTROLLER:handleCallback] ✗ Error handling callback:`, err.message);
    res.redirect(`${config.frontendUrl}/verify?error=callback_failed`);
  }
};

module.exports = { createVerificationRequest, getVerificationStatus, handleCallback };
