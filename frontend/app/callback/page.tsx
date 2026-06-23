"use client";

import { useEffect, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export default function CallbackPage() {
  const [message, setMessage] = useState("Processing verification…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const state  = params.get("state");
    const error  = params.get("error");

    console.log("[GovVerify:callback] Received Thunder callback");
    console.log("[GovVerify:callback] code:", code ? code.slice(0, 8) + "…" : "MISSING");
    console.log("[GovVerify:callback] state:", state);
    console.log("[GovVerify:callback] error:", error ?? "none");

    if (error) {
      console.error("[GovVerify:callback] Thunder returned error:", error);
      window.location.href = `/verify?error=${encodeURIComponent(error)}`;
      return;
    }

    if (!code || !state) {
      console.error("[GovVerify:callback] Missing code or state");
      window.location.href = "/verify?error=missing_callback_params";
      return;
    }

    // Forward to backend for code exchange — backend will redirect to /verify?requestId=...
    const backendUrl = `${BACKEND}/api/verification/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    console.log("[GovVerify:callback] Forwarding to backend:", backendUrl);
    setMessage("Verifying credentials…");
    window.location.href = backendUrl;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-600 text-sm font-medium">{message}</p>
    </div>
  );
}
