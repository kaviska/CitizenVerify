"use client";

const STEPS = [
  { number: 1, label: "Select Issuer" },
  { number: 2, label: "Select Claims" },
  { number: 3, label: "Show QR" },
  { number: 4, label: "Result" },
];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {STEPS.map((step, idx) => {
          const done = current > step.number;
          const active = current === step.number;
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={[
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    done
                      ? "bg-blue-600 text-white"
                      : active
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={[
                    "text-xs font-medium hidden sm:block",
                    active ? "text-blue-600" : done ? "text-slate-600" : "text-slate-400",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    "flex-1 h-0.5 mx-2 transition-colors",
                    current > step.number ? "bg-blue-600" : "bg-slate-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
