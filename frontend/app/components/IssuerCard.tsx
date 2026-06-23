"use client";

import { Issuer, ACCENT_CLASSES } from "../data/issuers";

interface Props {
  issuer: Issuer;
  selected: boolean;
  onSelect: () => void;
}

export default function IssuerCard({ issuer, selected, onSelect }: Props) {
  const accent = ACCENT_CLASSES[issuer.accentColor];
  return (
    <button
      onClick={onSelect}
      className={[
        "w-full text-left rounded-2xl border-2 p-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        selected
          ? `border-blue-600 ${accent.light} shadow-md`
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            selected ? accent.bg : "bg-slate-100",
          ].join(" ")}
        >
          <svg
            className={["w-6 h-6", selected ? "text-white" : "text-slate-500"].join(" ")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={issuer.iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">{issuer.name}</h3>
            {selected && (
              <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${accent.badge}`}>
                Selected
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">{issuer.description}</p>
        </div>
      </div>
    </button>
  );
}
