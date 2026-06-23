"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ISSUERS, Issuer, Claim } from "../data/issuers";
import StepIndicator from "../components/StepIndicator";
import IssuerCard from "../components/IssuerCard";
import ClaimCheckbox from "../components/ClaimCheckbox";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

const log  = (tag: string, ...args: unknown[]) => console.log( `[GovVerify:${tag}]`, ...args);
const warn = (tag: string, ...args: unknown[]) => console.warn(`[GovVerify:${tag}] ⚠`, ...args);
const err  = (tag: string, ...args: unknown[]) => console.error(`[GovVerify:${tag}] ✗`, ...args);

type ClaimResult = { label: string; value: string };

type VerificationResult = {
  status: "verified" | "failed" | "expired";
  officerName: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  claims: ClaimResult[];
};

export default function VerifyPage() {
  const [step, setStep]                     = useState(1);
  const [selectedIssuer, setSelectedIssuer] = useState<Issuer | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());

  const [requestId, setRequestId]       = useState<string | null>(null);
  const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading]       = useState(false);
  const [qrError, setQrError]           = useState<string | null>(null);

  const [result, setResult]   = useState<VerificationResult | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // ── helpers ──────────────────────────────────────────────────────────────

  const toggleClaim = useCallback((id: string) => {
    setSelectedClaims((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      log("toggleClaim", `${next.has(id) ? "added" : "removed"} claim="${id}" total=${next.size}`);
      return next;
    });
  }, []);

  const selectIssuer = (issuer: Issuer) => {
    log("selectIssuer", `selected issuer="${issuer.id}" name="${issuer.name}"`);
    setSelectedIssuer(issuer);
    setSelectedClaims(new Set());
  };

  // ── Step 1 → 2 ───────────────────────────────────────────────────────────

  const proceedToStep2 = () => {
    if (!selectedIssuer) return;
    const allClaims = new Set(selectedIssuer.claims.map((c) => c.id));
    log("proceedToStep2", `issuer="${selectedIssuer.id}" pre-selecting ${allClaims.size} claims`);
    setSelectedClaims(allClaims);
    setStep(2);
  };

  // ── Step 2 → 3: create PAR session, redirect browser to Thunder Gate ──────

  const generateQR = async () => {
    if (!selectedIssuer || selectedClaims.size === 0) {
      warn("generateQR", "called with no issuer or no claims selected — aborting");
      return;
    }

    const claimList = Array.from(selectedClaims);
    log("generateQR", `POST ${BACKEND}/api/verification/request`);
    log("generateQR", `payload: issuerId="${selectedIssuer.id}" claimIds=[${claimList.join(", ")}]`);

    setQrLoading(true);
    setQrError(null);

    try {
      const res  = await fetch(`${BACKEND}/api/verification/request`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ issuerId: selectedIssuer.id, claimIds: claimList }),
      });

      log("generateQR", `Response status: ${res.status}`);

      const json = await res.json();
      log("generateQR", `Response body:`, json);

      if (!json.success) {
        err("generateQR", `Backend returned success=false — error: "${json.error}"`);
        throw new Error(json.error);
      }

      const { requestId: rid, authorizeUrl: authUrl } = json.data;
      log("generateQR", `✓ requestId="${rid}"`);
      log("generateQR", `✓ authorizeUrl="${authUrl}"`);

      setRequestId(rid);
      setAuthorizeUrl(authUrl);
      setStep(3);
      log("generateQR", `✓ Moved to Step 3 — redirecting to Thunder Gate`);

      // Redirect the browser to Thunder's Gate (shows EUDI Wallet QR code)
      window.location.href = authUrl;

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      err("generateQR", `Failed: ${message}`);
      setQrError(message);
    } finally {
      setQrLoading(false);
    }
  };

  // ── On mount: check if returning from Thunder callback (?requestId=...) ──

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rid    = params.get("requestId");
    if (!rid) return;

    log("mount", `Returning from Thunder callback — requestId="${rid}"`);
    setRequestId(rid);

    // Fetch result immediately (callback has already set status to verified)
    fetch(`${BACKEND}/api/verification/status/${rid}`)
      .then((r) => r.json())
      .then((json) => {
        log("mount", `Status on return: "${json.data?.status}"`);
        if (json.data?.status === "verified") {
          setResult({ ...json.data.result, status: "verified" });
          setStep(4);
        } else {
          // Not yet verified — start polling via step 3
          setStep(3);
        }
      })
      .catch((e) => {
        warn("mount", `Could not fetch status on return: ${e.message}`);
        setStep(3);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 3: poll backend every 2s while waiting ───────────────────────────

  useEffect(() => {
    if (step !== 3 || !requestId) return;

    log("polling", `Starting — requestId="${requestId}" polling every 2s`);
    setPolling(true);
    setPollCount(0);

    const interval = setInterval(async () => {
      setPollCount((n) => {
        log("polling", `Poll #${n + 1} — GET ${BACKEND}/api/verification/status/${requestId}`);
        return n + 1;
      });

      try {
        const res  = await fetch(`${BACKEND}/api/verification/status/${requestId}`);
        const json = await res.json();

        log("polling", `Response status=${res.status} data.status="${json.data?.status}"`);

        if (!json.success) {
          warn("polling", `Backend returned success=false: "${json.error}"`);
          return;
        }

        const data = json.data;

        if (data.status === "verified") {
          log("polling", `✓ Status is "verified" — stopping poll, showing result`);
          log("polling", `Result:`, data.result);
          clearInterval(interval);
          setPolling(false);
          setResult({ ...data.result, status: "verified" });
          setStep(4);

        } else if (data.status === "failed") {
          warn("polling", `Session failed — Thunder could not verify the credential`);
          clearInterval(interval);
          setPolling(false);
          setResult({ status: "failed", officerName: "", issuedBy: "", issuedAt: "", expiresAt: "", claims: [] });
          setStep(4);

        } else if (data.status === "expired") {
          warn("polling", `Session expired — QR code timed out`);
          clearInterval(interval);
          setPolling(false);
          setResult({ status: "expired", officerName: "", issuedBy: "", issuedAt: "", expiresAt: "", claims: [] });
          setStep(4);

        } else {
          log("polling", `Status still "${data.status}" — waiting…`);
        }

      } catch (e: unknown) {
        warn("polling", `Network error on poll — will retry: ${e instanceof Error ? e.message : String(e)}`);
      }
    }, 2000);

    return () => {
      log("polling", `Stopping interval (step changed or component unmounted)`);
      clearInterval(interval);
      setPolling(false);
    };
  }, [step, requestId]);

  // ── reset ────────────────────────────────────────────────────────────────

  const reset = () => {
    log("reset", "Resetting to Step 1");
    setStep(1);
    setSelectedIssuer(null);
    setSelectedClaims(new Set());
    setRequestId(null);
    setAuthorizeUrl(null);
    setQrError(null);
    setResult(null);
    setPolling(false);
    setPollCount(0);
  };

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm">GovVerify</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <StepIndicator current={step} />

        <div className="flex-1 px-4 pb-8">

          {/* ── Step 1: Select Issuer ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Select Issuing Authority</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Choose the government department that issued the officer's credentials.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {ISSUERS.map((issuer) => (
                  <IssuerCard
                    key={issuer.id}
                    issuer={issuer}
                    selected={selectedIssuer?.id === issuer.id}
                    onSelect={() => selectIssuer(issuer)}
                  />
                ))}
              </div>
              <button
                onClick={proceedToStep2}
                disabled={!selectedIssuer}
                className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step 2: Select Claims ── */}
          {step === 2 && selectedIssuer && (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {selectedIssuer.name}
                </span>
                <h1 className="text-xl font-bold text-slate-900 mt-2">Select Claims to Verify</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Choose which credential fields the officer needs to present.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedClaims.size} of {selectedIssuer.claims.length} selected
                </span>
                <button
                  onClick={() => {
                    if (selectedClaims.size === selectedIssuer.claims.length) {
                      log("claimsToggle", "Deselecting all claims");
                      setSelectedClaims(new Set());
                    } else {
                      const all = new Set(selectedIssuer.claims.map((c) => c.id));
                      log("claimsToggle", `Selecting all ${all.size} claims`);
                      setSelectedClaims(all);
                    }
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {selectedClaims.size === selectedIssuer.claims.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {selectedIssuer.claims.map((claim: Claim) => (
                  <ClaimCheckbox
                    key={claim.id}
                    claim={claim}
                    checked={selectedClaims.has(claim.id)}
                    onChange={() => toggleClaim(claim.id)}
                  />
                ))}
              </div>

              {qrError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <p className="font-semibold">Failed to generate QR</p>
                  <p className="mt-0.5 font-mono text-xs break-all">{qrError}</p>
                  <p className="mt-1 text-xs text-red-600">Check the browser console and backend terminal for details.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { log("nav", "Back to Step 1"); setStep(1); }}
                  disabled={qrLoading}
                  className="flex-1 h-12 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  onClick={generateQR}
                  disabled={selectedClaims.size === 0 || qrLoading}
                  className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
                >
                  {qrLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    "Generate QR Code"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Waiting for verification (redirected to Thunder Gate) ── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h1 className="text-xl font-bold text-slate-900">Waiting for Verification</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Complete the scan in the verification portal, then return here.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-5">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">EUDI Wallet verification in progress</p>
                  <p className="text-xs text-slate-500 mt-1">
                    The officer scans the QR code in the verification portal with their EUDI Wallet app.
                  </p>
                </div>

                {authorizeUrl && (
                  <a
                    href={authorizeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Re-open verification portal →
                  </a>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-blue-800">
                    {polling ? `Waiting for officer to approve… (check #${pollCount})` : "Checking status…"}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    This page will update automatically once the officer approves.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  log("nav", "Back to Step 2");
                  setStep(2);
                  setAuthorizeUrl(null);
                  setRequestId(null);
                  setPollCount(0);
                }}
                className="w-full h-12 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Start Over
              </button>
            </div>
          )}

          {/* ── Step 4: Result ── */}
          {step === 4 && result && (
            <div className="flex flex-col gap-6">
              {result.status === "verified" ? (
                <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 text-base">Identity Verified</p>
                    <p className="text-emerald-700 text-sm mt-0.5">
                      This officer's credentials have been cryptographically verified by the EUDI Wallet.
                    </p>
                  </div>
                </div>
              ) : result.status === "failed" ? (
                <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-red-800 text-base">Verification Failed</p>
                    <p className="text-red-700 text-sm mt-0.5">
                      Could not verify this officer's credentials. Do not comply with requests.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-amber-800 text-base">QR Code Expired</p>
                    <p className="text-amber-700 text-sm mt-0.5">
                      The QR code expired before the officer scanned it. Please generate a new one.
                    </p>
                  </div>
                </div>
              )}

              {result.status === "verified" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-blue-600 px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">{result.officerName}</p>
                      <p className="text-blue-200 text-xs">{result.issuedBy}</p>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3">
                    {result.claims.map((claim) => (
                      <div key={claim.label} className="flex items-start justify-between gap-4">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex-shrink-0">
                          {claim.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 text-right">{claim.value}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Issued</span>
                        <span className="text-xs font-semibold text-slate-700">{result.issuedAt}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expires</span>
                        <span className="text-xs font-semibold text-slate-700">{result.expiresAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs text-slate-600">
                  Verified via <span className="font-semibold text-slate-800">Thunder EUDI OpenID4VP</span> — cryptographically signed credential.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 h-12 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  New Verification
                </button>
                <Link
                  href="/"
                  className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  Done
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
