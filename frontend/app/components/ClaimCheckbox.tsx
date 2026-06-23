"use client";

import { Claim } from "../data/issuers";

interface Props {
  claim: Claim;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function ClaimCheckbox({ claim, checked, onChange }: Props) {
  return (
    <label
      className={[
        "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
        checked
          ? "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:border-slate-300",
      ].join(" ")}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={[
            "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
            checked ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300",
          ].join(" ")}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <p className="text-sm font-medium text-slate-800 leading-tight">{claim.label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{claim.description}</p>
      </div>
    </label>
  );
}
