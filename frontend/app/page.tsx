import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GovVerify — Verify Government Officer Credentials",
  description: "Instantly verify the legitimacy of government officers using EU Digital Identity Wallet credentials.",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Select Issuing Authority",
    description: "Choose the government department — Police, Tax, Customs, or Immigration — that issued the officer's credentials.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    step: "02",
    title: "Choose Claims to Verify",
    description: "Select which credential fields you need — name, badge number, rank, jurisdiction, and more.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    step: "03",
    title: "Show QR Code",
    description: "A unique QR code is generated. Ask the officer to scan it with their official government wallet app.",
    icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 4h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
  },
  {
    step: "04",
    title: "See the Result",
    description: "Cryptographically verified credentials are displayed instantly. Know with certainty who you're dealing with.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
];

const SUPPORTED_ISSUERS = [
  { name: "Police Department", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Income Tax Dept.", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { name: "Customs Authority", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { name: "Immigration Dept.", color: "bg-violet-100 text-violet-800 border-violet-200" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-base tracking-tight">GovVerify</span>
          </div>
          <Link
            href="/verify"
            className="h-9 px-4 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Verify Now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-blue-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-200 text-xs font-semibold mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            EUDI Wallet Compatible
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight max-w-2xl">
            Verify Government Officers{" "}
            <span className="text-blue-400">in Seconds</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
            Use cryptographically signed digital credentials to confirm whether a person is a legitimate
            government official — Police, Tax Inspector, Customs Officer, or Immigration Agent.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/verify"
              className="h-12 px-8 bg-blue-500 hover:bg-blue-400 text-white font-bold text-base rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex items-center justify-center gap-2"
            >
              Start Verification
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="h-12 px-8 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold text-base rounded-xl transition-colors flex items-center justify-center"
            >
              How it works
            </a>
          </div>

          {/* Supported issuers */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Supported Authorities</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUPPORTED_ISSUERS.map((issuer) => (
                <span
                  key={issuer.name}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${issuer.color}`}
                >
                  {issuer.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-2 text-slate-500 text-sm sm:text-base max-w-md mx-auto">
              Four simple steps to verify an officer's credentials using EU Digital Identity standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-4 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Step {item.step}</span>
                  <h3 className="mt-1 font-bold text-slate-900 text-base leading-tight">{item.title}</h3>
                  <p className="mt-1.5 text-slate-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 sm:p-12 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Built on EU Digital Identity Standards</h2>
            <p className="mt-3 text-blue-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              GovVerify uses the EU Digital Identity Wallet (EUDI) framework with W3C Verifiable Credentials.
              All credentials are cryptographically signed and tamper-evident — no central database, no privacy risk.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { label: "Cryptographic", sub: "Verification" },
                { label: "Privacy", sub: "Preserving" },
                { label: "EU eIDAS 2.0", sub: "Compliant" },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-xs text-blue-200 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
            <Link
              href="/verify"
              className="mt-8 inline-flex items-center gap-2 h-12 px-8 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
            >
              Verify an Officer Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-slate-700 text-sm">GovVerify</span>
          </div>
          <p className="text-xs text-slate-400">
            Powered by EU Digital Identity Wallet infrastructure. For authorized use only.
          </p>
        </div>
      </footer>
    </div>
  );
}
