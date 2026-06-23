Thivaharan Kalyanasundaram: # Thunder as an EUDI OpenID4VP Verifier

This guide walks through setting up Thunder as a verifier for the EUDI Wallet ecosystem — from registering with the sandbox and obtaining certificates, to configuring Thunder and running an end-to-end login flow.

---

## Overview

Thunder acts as the **Relying Party (verifier)** in the OpenID4VP protocol. Users authenticate by presenting their EUDI PID credential from the EUDI Wallet app instead of entering a username and password. Thunder verifies the presentation and provisions a local user account automatically on first login.

**Flow:**
User → Gate (QR code) → EUDI Wallet (scan + approve) → Thunder verifies → user logged in

---

## Prerequisites

Thunder running locally (see [README](../README.md))
[ngrok](https://ngrok.com) installed — the wallet must reach Thunder over the internet
An account on the [EUDI Sandbox Registrar](https://sandbox.eudi-wallet.org)
The **EUDI Wallet DE Sandbox** app installed on iOS (via TestFlight, invited by Sprind GmbH) or Android

---

## Step 1 — Expose Thunder via ngrok

The EUDI wallet fetches the request object and posts the response over the public internet, so Thunder must be publicly reachable.
bash
ngrok http https://localhost:8090 --host-header=localhost

Note the forwarding URL — e.g. https://abc123.ngrok-free.app. This is your base_url.
>**Tip:** Free ngrok URLs change on every restart. Use a fixed domain (paid plan) or update `ase_url`in `eployment.yaml`each time you restart ngrok.
---

## Step 2 — Register with the EUDI Sandbox

Log in to the [EUDI Sandbox Registrar](https://sandbox.eudi-wallet.org) and navigate to your organisation.

### 2a — Create the Access Certificate

The access certificate proves Thunder's identity to the EUDI wallet.

1. Click **+ Access Certificates**.
2. **DNS Entries:** enter your ngrok hostname — e.g. `ac123.ngrok-free.app`.
3. **Public Key (P-256 only) as PEM:** generate a key pair and paste the public key:

`
sh
# Generate the private key — keep this safe
openssl ecparam -name prime256v1 -genkey -noout \
  -out backend/cmd/server/repository/resources/security/eudi-access.key

# Print the public key to paste into the form
openssl ec -in backend/cmd/server/repository/resources/security/eudi-access.key -pubout
`
. Click **Create Access Certificate** and download the `.rt` ile:

`
sh
cp ~/Downloads/<downloaded>.crt \
  backend/cmd/server/repository/resources/security/eudi-access.crt
`
. Download the German Registrar CA certificate and build the chain file. Wallets require the full chain in the `xc` eader to verify Thunder's identity:

`
sh
curl -o backend/cmd/server/repository/resources/security/german-registrar-ca.pem \
  https://sandbox.eudi-wallet.org/api/ca

cat backend/cmd/server/repository/resources/security/eudi-access.crt \
    backend/cmd/server/repository/resources/security/german-registrar-ca.pem \
  > backend/cmd/server/repository/resources/security/eudi-access-chain.crt
`
. Compute your `cient_id` rom the certificate:

`
sh
openssl x509 -in backend/cmd/server/repository/resources/security/eudi-access.crt \
  -outform DER \
  | openssl dgst -sha256 -binary \
  | openssl base64 -A \
  | tr '+/' '-_' | tr -d '='
`
refix the result with `x09_hash:`  e.g. `x09_hash:gJm91IZzlwEysyvi-OubMHbiYnhzoIsGkLKENAbkdps`.

### 2b — Create the Registration Certificate

The registration certificate tells the wallet what credentials Thunder is authorised to request.

1. Click **+ Registration Certificates**.
2. Fill in:

| Field | Value |
|---|---|
| Privacy Policy URL | `htps://<ngrok-url>/privacy` any valid HTTPS URL for sandbox) |
| Format | `d+sd-jwt` 
| VCT Values | `un:eudi:pid:de:1` 
| Claims | Add each separately: `gven_name`,`fmily_name`,`brthdate` 
| Purpose → Locale | English |
| Purpose → Description | `Ientity verification for login using EUDI Wallet PID` 

3. Click **Create Registration Certificate** and save the downloaded JWT file:

`
sh
cp ~/Downloads/<registration-cert-file> \
  backend/cmd/server/repository/resources/security/eudi-registration.jwt
`
Te file contains a raw JWT string (despite the `.jon` etension). Thunder reads it as-is.

---
## Step 3 — Register the key pair in Thunder's KMS

Add the access key as a named entry in `depoyment.yaml` uner `cry
to.keys`:
``
crypto:
  keys:
    - id: "default-key"
      cert_file: "repository/resources/security/signing.cert"
      key_file: "repository/resources/security/signing.key"
    - id: "eudi-access-key"
      cert_file: "repository/resources/security/eudi-access-chain.crt"
      key_file: "repository/resources/security/eudi-access.key"
```
nder embeds the certificate in the `x5c heder of every signed request object so the wallet can verify Thunder's identity.

---

## Step 4 — Configure the OpenID4VP verifier

Add the following to `dep
oyment.yaml`:
``
openid4vp:
  # x509_hash of the access certificate DER — computed in Step 2a
  client_id: "x509_hash:<hash>"

  # Key ID registered in crypto.keys above
  signing_key_id: "eudi-access-key"

  # Label for the per-request ephemeral ECDH-ES encryption key (any string)
  ephemeral_key_id: "enc-1"

  # Public HTTPS base URL — your ngrok URL
  base_url: "https://<ngrok-url>"

  # Standard audience for EUDI wallet requests
  request_audience: "https://self-issued.me/v2"

  # Content encryption algorithms for the wallet's JWE response (advertise both for iOS + Android compatibility)
  response_enc_values:
    - "A128GCM"
    - "A256GCM"

  # Registration certificate JWT obtained in Step 2b
  registration_cert_file: "repository/resources/security/eudi-registration.jwt"

  # enforce_trusted_issuer: skip issuer certificate verification (set true for production)
  # enforce_key_binding: verify the holder's key binding proof in the SD-JWT
  enforce_trusted_issuer: false
  enforce_key_binding: true

  # Clock skew tolerance for JWT validation
  leeway_seconds: 5

  # Rejects key binding JWTs older than this many seconds (replay protection)
  key_binding_max_age_seconds: 300

  presentation_definitions:
    - id: "eudi-pid"
      display_name: "EUDI Wallet PID"
      credential_id: "pid-sd-jwt"
      vct: "urn:eudi:pid:de:1"
      # mandatory_claims must be present in the disclosed presentation; verification fails if missing
      mandatory_claims:
        - "given_name"
        - "family_name"
      # optional_claims are requested in the DCQL query and allowed if disclosed, but not required
      optional_claims:
        - "birthdate"
      # subject_claims are used to derive a stable subject identifier when the credential has no sub
      subject_claims:
        - "family_name"
        - "given_name"
```
`nfoce_trusted_issuer`:** hen `fals`, Thnder skips cryptographic verification of the credential issuer's certificate. Keep `fals` forsandbox testing; set `true forproduction with trusted issuer certificates configured.
> **`nfoce_key_binding`:** hen `true, Thnder verifies the holder's Key Binding JWT (proof of possession). This is recommended even for sandbox testing — the EUDI wallet sandbox app correctly signs key binding proofs.

---
## Step 5 — Create the EUDI user type

Thunder needs an entity type that matches the attributes returned in the PID. Run the bootstrap script on a fresh install — it creates the `eudi-ser` typeautomatically. For an existing installation, create it via the Console:

1. Open the Thunder Console → **User Types** → **Add**.
2. Fill in:
   - **Name:** `eudi-ser`
   -**Allow Self Registration:** enabled
   
3. Add attributes:

| Name | Type | Display Name | Unique |
|---|---|---|---|
| `givenname` | sting | First Name | No |
| `famil_name` | sting | Last Name | No |
| `birthate` | sting | Date of Birth | No |
| `sub`  sting | Subject | Yes |

4. Save.

---

## Step 6 — Configure the application

1. Open the Thunder Console → **Applications** → select your app.
2. Under **Allowed User Types**, add `eudi-ser` (kee `Perso` if yu have other flows).
3. Under **Authentication Flow**, select `Defaut EUDI Wallet Authentication Flow`.
4. ave.
> `Persn must ave **Allow Self Registration disabled**. `eudi-uer` must ave it **enabled**. This ensures the provisioning step auto-selects `eudi-uer` withot prompting.

---

## Step 7 — Load a test PID into the EUDI wallet

The EUDI Wallet DE Sandbox app (TestFlight) connects to the EUDI sandbox issuer. Inside the wallet:

1. Go to **Add Credential** → **PID**.
2. The wallet connects to `https:/issuer.eudiw.dev/` and isues a test PID with fake data.
3. Complete the issuance flow. The PID will appear in your wallet.

---

## Step 8 — Run the end-to-end flow

```bas
Terminal 1 — start Thunder and the Gate
make run

# Terminal 2 — start ngrok (if not already running)
ngrok http https://localhost:8090 --host-header=localhost
```

1
n your application's OAuth2 login URL in a browser.
2. The Gate shows the EUDI login page. Click **Sign in with EUDI Wallet**.
3. A QR code is displayed (or a `Scan wth your EUDI Wallet` promp).
4. Open the EUDI Wallet app on your phone and scan the QR code.
5. The wallet fetches Thunder's request object, shows a consent screen listing the requested claims.
6. Approve in the wallet.
7. Back in the browser, click **Refresh status**.
8. Thunder verifies the presentation, provisions your account (first login) or looks up your account (returning user), and redirects back to the application logged in.

---

## Returning users

On the first login Thunder creates a `eudi-uer` accout using the PID's `sub` caimas the unique identifier and stores the disclosed claims (`given_ame`, `famlyname`, `birhdte`). On ubsequent logins Thunder finds the existing account by `sub` ad sips creation — the user is authenticated directly. The experience is identical either way: no input required.

---

## Enabling full validation (production)

For production with real EUDI-issued credentials, set in `deployent.yaml`:

```am
enid4vp:
  enforce_trusted_issuer: true
  enforce_key_binding: true
```

A
d the Bundesdruckerei issuer certificate under `truste_issuers` in th presentation definition:

```yam
presentation_definitions:
    - id: "eudi-pid"
      ...
      trusted_issuers:
        - issuer: "https://pid.bundesdruckerei.de"
          cert_file: "repository/resources/security/eudi-pid-issuer.cert"
```

D
ad the issuer certificate from the EUDI sandbox trust list at `https:/bmi.usercontent.opencode.de/eudi-wallet/test-trust-lists/`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Wallet shows "Could not trust certificate chain" | `x5c` i th request object only contains the leaf cert, not the full chain | Ensure `cert_fle` in `dployent.yaml` point to `eudi-acess-chain.crt` (leaf+ CA concatenated), not just `eudi-acess.crt` |
| Wllet shows "Oops something went wrong" immediately | Wrong wallet app or QR contains `https:/` insted of `openidvp://` | Usethe EUDI Wallet DE Sandbox app; generate QR from the full `openidvp://` URI |
| ngrok gets no request after QR scan | Wallet not making network call | Manually generate QR from the `openidvp://` URI uing a QR generator tool |
| `400 EUI-1003` on `PST /penid4vp/response` | JWEdecryption failure or SD-JWT verification failure | Check Thunder logs for the exact error; if `key biding signature verification failed`, ensue `enforc_key_binding: true` and tat the wallet sends a KB-JWT |
| `Failedto fetch user attributes: entity not found` | `eui-uer` type ot created or not added to application | Create the user type and add it to the application's allowed user types |
| `Failedto fetch schema attributes: user type not found` | `eui-uer` does ot have `AllowSlfRegistration: true` | Enale self-registration on the `eudi-uer` type 
| `APP-105` when etting allowed user types | Application user attributes reference fields not in `eudi-uer` schem | Keep `Person in th allowed types alongside `eudi-uer` |
| nrok URL changed after restart | Free ngrok URL is not fixed | Update `base_ul` in `dployent.yaml` and rstart Thunder |