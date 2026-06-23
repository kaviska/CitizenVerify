const { v4: uuidv4 } = require("uuid");
const issuerModel  = require("../models/issuer.model");
const requestModel = require("../models/verificationRequest.model");
const thunder      = require("./thunder.service");

// ─── createRequest ─────────────────────────────────────────────────────────

const createRequest = async (issuerId, claimIds) => {
  console.log(`\n[VERIFICATION:createRequest] issuerId="${issuerId}" claimIds=[${claimIds.join(", ")}]`);

  const issuer = issuerModel.getById(issuerId);
  if (!issuer) {
    console.error(`[VERIFICATION:createRequest] ✗ Issuer "${issuerId}" not found`);
    throw new Error(`Issuer '${issuerId}' not found`);
  }
  console.log(`[VERIFICATION:createRequest] Issuer found: "${issuer.name}"`);

  const validIds      = issuer.claims.map((c) => c.id);
  const invalidClaims = claimIds.filter((id) => !validIds.includes(id));
  if (invalidClaims.length) {
    console.error(`[VERIFICATION:createRequest] ✗ Invalid claim IDs: [${invalidClaims.join(", ")}]`);
    console.error(`[VERIFICATION:createRequest]   Valid IDs for this issuer: [${validIds.join(", ")}]`);
    throw new Error(`Invalid claim IDs: ${invalidClaims.join(", ")}`);
  }

  const requestId = uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase();
  console.log(`[VERIFICATION:createRequest] Generated requestId="${requestId}"`);

  console.log(`[VERIFICATION:createRequest] Calling Thunder to start session…`);
  let session;
  try {
    session = await thunder.startSession(requestId);
  } catch (err) {
    console.error(`[VERIFICATION:createRequest] ✗ Thunder startSession failed:`, err.message);
    throw err;
  }

  console.log(`[VERIFICATION:createRequest] ✓ Thunder PAR session started`);
  console.log(`[VERIFICATION:createRequest] authorizeUrl=${session.authorizeUrl}`);

  const record = requestModel.create({
    requestId,
    issuerId,
    claimIds,
    status:       "pending",
    authorizeUrl: session.authorizeUrl,
    codeVerifier: session.codeVerifier,
    createdAt:    new Date().toISOString(),
  });

  console.log(`[VERIFICATION:createRequest] ✓ Record stored:`, {
    requestId: record.requestId,
    status:    record.status,
  });

  return { requestId: record.requestId, authorizeUrl: record.authorizeUrl, status: record.status };
};

// ─── getRequestStatus ──────────────────────────────────────────────────────

const getRequestStatus = async (requestId) => {
  console.log(`[VERIFICATION:getRequestStatus] requestId="${requestId}"`);

  const record = requestModel.getById(requestId);
  if (!record) {
    console.warn(`[VERIFICATION:getRequestStatus] ✗ No record found for requestId="${requestId}"`);
    return null;
  }

  console.log(`[VERIFICATION:getRequestStatus] Current local status="${record.status}"`);

  // Already resolved — no need to call Thunder
  if (record.status === "verified" || record.status === "failed" || record.status === "expired") {
    console.log(`[VERIFICATION:getRequestStatus] Already resolved — returning cached status="${record.status}"`);
    return record;
  }

  // Status is updated when Thunder calls our callback — just return current record
  console.log(`[VERIFICATION:getRequestStatus] Returning local record (status updated on callback)`);
  return record;
};

// ─── Demo defaults for claims not present in the EUDI PID token ───────────
// The PID only carries given_name, family_name, birthdate, sub.
// Custom issuer fields (badge_number, rank, etc.) fall back to these values.

const CLAIM_DEFAULTS = {
  full_name:           null,          // derived from given_name + family_name below
  badge_number:        "P-4721",
  rank:                "Senior Officer",
  precinct:            "Central District HQ",
  jurisdiction:        "Metropolitan Area",
  service_since:       "2017",
  employee_id:         "GOV-88234",
  designation:         "Senior Inspector",
  division:            "Central Division",
  authorization_level: "Level 3 — Full Authority",
  valid_until:         "31 Dec 2026",
  officer_id:          "C-1847",
  port_of_duty:        "International Airport Terminal A",
  clearance_level:     "SECRET",
  district:            "East Metro Regional Office",
};

// ─── handleCallback ────────────────────────────────────────────────────────

const handleCallback = async (code, state) => {
  console.log(`\n[VERIFICATION:handleCallback] code=${code.slice(0, 8)}… state="${state}"`);

  const record = requestModel.getById(state);
  if (!record) {
    console.error(`[VERIFICATION:handleCallback] ✗ No request found for state="${state}"`);
    throw new Error("Verification request not found");
  }
  console.log(`[VERIFICATION:handleCallback] Found request — issuerId="${record.issuerId}" status="${record.status}"`);

  if (!record.codeVerifier) {
    console.error(`[VERIFICATION:handleCallback] ✗ No codeVerifier stored for state="${state}" — cannot exchange token`);
    throw new Error("PKCE code_verifier missing for this request");
  }

  console.log(`[VERIFICATION:handleCallback] Exchanging code for id_token (PKCE)…`);
  let claims;
  try {
    claims = await thunder.exchangeCode(code, record.codeVerifier);
  } catch (err) {
    console.error(`[VERIFICATION:handleCallback] ✗ Code exchange failed:`, err.message);
    throw err;
  }

  console.log(`[VERIFICATION:handleCallback] Claims received from Thunder:`, {
    given_name:  claims.given_name,
    family_name: claims.family_name,
    birthdate:   claims.birthdate,
    sub:         claims.sub,
  });

  const issuer          = issuerModel.getById(record.issuerId);

  // Derive full_name from PID fields if available
  const pidFullName = [claims.given_name, claims.family_name].filter(Boolean).join(" ") || null;

  const requestedClaims = record.claimIds.map((claimId) => {
    const def = issuer.claims.find((c) => c.id === claimId);

    let value = claims[claimId];

    // full_name: combine PID given_name + family_name
    if (claimId === "full_name" && !value) {
      value = pidFullName;
    }

    // Fall back to demo default if still missing
    if (!value) {
      value = CLAIM_DEFAULTS[claimId] ?? "—";
      if (value !== "—") {
        console.log(`[VERIFICATION:handleCallback] Using demo default for "${claimId}": "${value}"`);
      } else {
        console.warn(`[VERIFICATION:handleCallback] ⚠ No value or default for claim "${claimId}"`);
      }
    }

    return { id: claimId, label: def ? def.label : claimId, value };
  });

  const officerName = pidFullName
    || requestedClaims.find((c) => c.id === "full_name")?.value
    || "Verified Officer";

  const result = {
    officerName,
    issuedBy:   "EUDI Wallet",
    issuedAt:   new Date().toISOString().slice(0, 10),
    expiresAt:  claims.exp ? new Date(claims.exp * 1000).toISOString().slice(0, 10) : "—",
    claims:     requestedClaims,
    verifiedAt: new Date().toISOString(),
  };

  console.log(`[VERIFICATION:handleCallback] ✓ Saving result — officerName="${officerName}" claimsCount=${requestedClaims.length}`);

  return requestModel.updateStatus(state, { status: "verified", result });
};

module.exports = { createRequest, getRequestStatus, handleCallback };
