const crypto = require("crypto");
const config  = require("../../config");

const { url, clientId, redirectUri } = config.thunder;

// ─── PKCE ─────────────────────────────────────────────────────────────────

const generatePKCE = () => {
  const verifier  = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
};

// ─── startSession ──────────────────────────────────────────────────────────
// Public client: client_id in body only, no Authorization header, no secret.
// Returns { authorizeUrl, codeVerifier } — backend stores codeVerifier for
// the token exchange; frontend redirects browser to authorizeUrl.

const startSession = async (state) => {
  console.log(`\n[THUNDER:startSession] Starting PAR session state="${state}"`);
  console.log(`[THUNDER:startSession] client_id=${clientId} (public client — no secret)`);

  const { verifier, challenge } = generatePKCE();
  console.log(`[THUNDER:startSession] PKCE verifier[:8]=${verifier.slice(0, 8)}...`);
  console.log(`[THUNDER:startSession] PKCE challenge=${challenge}`);

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             clientId,
    scope:                 "openid",
    state,
    code_challenge:        challenge,
    code_challenge_method: "S256",
  });

  if (redirectUri) {
    params.append("redirect_uri", redirectUri);
    console.log(`[THUNDER:startSession] redirect_uri=${redirectUri}`);
  } else {
    console.warn(`[THUNDER:startSession] ⚠ No redirect_uri configured — Thunder will use the app default`);
  }

  const parUrl = `${url}/oauth2/par`;
  console.log(`[THUNDER] --> POST ${parUrl}`);
  console.log(`[THUNDER:startSession] PAR body: ${params.toString()}`);

  let res;
  try {
    res = await fetch(parUrl, {
      method:  "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept":       "application/json",
      },
      body: params.toString(),
    });
  } catch (err) {
    console.error(`[THUNDER:startSession] Network error on PAR:`, err.message);
    throw err;
  }

  const body = await res.text();
  console.log(`[THUNDER] <-- ${res.status} POST ${parUrl}`);
  console.log(`[THUNDER:startSession] PAR response: ${body}`);

  if (!res.ok) {
    throw new Error(`PAR request failed ${res.status}: ${body}`);
  }

  let parData;
  try {
    parData = JSON.parse(body);
  } catch {
    throw new Error(`PAR response is not JSON: ${body}`);
  }

  const { request_uri, expires_in } = parData;
  console.log(`[THUNDER:startSession] request_uri=${request_uri}`);
  console.log(`[THUNDER:startSession] expires_in=${expires_in}s`);

  if (!request_uri) {
    throw new Error(`PAR response missing request_uri: ${body}`);
  }

  const authorizeUrl = `${url}/oauth2/authorize?${new URLSearchParams({ client_id: clientId, request_uri }).toString()}`;
  console.log(`[THUNDER:startSession] ✓ authorizeUrl=${authorizeUrl}`);

  return { authorizeUrl, codeVerifier: verifier };
};

// ─── exchangeCode ──────────────────────────────────────────────────────────
// Public client PKCE exchange: client_id + code_verifier in body, no secret.

const exchangeCode = async (code, codeVerifier) => {
  console.log(`\n[THUNDER:exchangeCode] Exchanging code (PKCE)`);
  console.log(`[THUNDER:exchangeCode] code[:8]=${code.slice(0, 8)}…`);
  console.log(`[THUNDER:exchangeCode] codeVerifier[:8]=${codeVerifier.slice(0, 8)}…`);

  const params = new URLSearchParams({
    grant_type:    "authorization_code",
    code,
    client_id:     clientId,
    code_verifier: codeVerifier,
  });

  if (redirectUri) {
    params.append("redirect_uri", redirectUri);
  }

  const tokenUrl = `${url}/oauth2/token`;
  console.log(`[THUNDER] --> POST ${tokenUrl}`);

  let res;
  try {
    res = await fetch(tokenUrl, {
      method:  "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept":       "application/json",
      },
      body: params.toString(),
    });
  } catch (err) {
    console.error(`[THUNDER:exchangeCode] Network error:`, err.message);
    throw err;
  }

  const text = await res.text();
  console.log(`[THUNDER] <-- ${res.status} POST ${tokenUrl}`);

  if (!res.ok) {
    console.error(`[THUNDER:exchangeCode] Token exchange failed:`, text);
    throw new Error(`Token exchange failed ${res.status}: ${text}`);
  }

  const tokens = JSON.parse(text);
  console.log(`[THUNDER:exchangeCode] Token response keys:`, Object.keys(tokens));

  if (!tokens.id_token) {
    console.error(`[THUNDER:exchangeCode] ⚠ No id_token in response:`, tokens);
    throw new Error("Thunder did not return an id_token");
  }

  const parts = tokens.id_token.split(".");
  if (parts.length !== 3) {
    throw new Error(`id_token is not a valid JWT (parts=${parts.length})`);
  }

  const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  console.log(`[THUNDER:exchangeCode] Decoded claims:`, {
    sub:         claims.sub,
    given_name:  claims.given_name,
    family_name: claims.family_name,
    birthdate:   claims.birthdate,
    exp:         claims.exp,
  });

  if (!claims.given_name && !claims.family_name) {
    console.warn(`[THUNDER:exchangeCode] ⚠ given_name and family_name both missing — check eudi-user attribute names in Thunder Console`);
  }

  return claims;
};

module.exports = { startSession, exchangeCode };
