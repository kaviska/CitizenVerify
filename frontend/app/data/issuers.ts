export type Claim = {
  id: string;
  label: string;
  description: string;
};

export type Issuer = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconPath: string;
  accentColor: string;
  claims: Claim[];
};

export const ISSUERS: Issuer[] = [
  {
    id: "police",
    name: "Police Department",
    shortName: "Police",
    description: "Verify the identity and credentials of a police officer",
    iconPath: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    accentColor: "blue",
    claims: [
      { id: "full_name", label: "Full Name", description: "Legal full name of the officer" },
      { id: "badge_number", label: "Badge Number", description: "Unique badge identifier" },
      { id: "rank", label: "Rank", description: "Current rank and title" },
      { id: "precinct", label: "Precinct / Unit", description: "Assigned precinct or unit" },
      { id: "jurisdiction", label: "Jurisdiction", description: "Area of authority" },
      { id: "service_since", label: "Service Since", description: "Year of joining the force" },
    ],
  },
  {
    id: "tax",
    name: "Income Tax Department",
    shortName: "Tax Dept.",
    description: "Verify the identity of an income tax official or inspector",
    iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    accentColor: "green",
    claims: [
      { id: "full_name", label: "Full Name", description: "Legal full name of the official" },
      { id: "employee_id", label: "Employee ID", description: "Government employee identifier" },
      { id: "designation", label: "Designation", description: "Official job title" },
      { id: "division", label: "Division", description: "Tax division or circle" },
      { id: "authorization_level", label: "Authorization Level", description: "Level of official authority" },
      { id: "valid_until", label: "Valid Until", description: "Credential expiry date" },
    ],
  },
  {
    id: "customs",
    name: "Customs Authority",
    shortName: "Customs",
    description: "Verify the credentials of a customs or border control officer",
    iconPath: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
    accentColor: "amber",
    claims: [
      { id: "full_name", label: "Full Name", description: "Legal full name of the officer" },
      { id: "officer_id", label: "Officer ID", description: "Customs officer badge number" },
      { id: "port_of_duty", label: "Port of Duty", description: "Assigned port or checkpoint" },
      { id: "clearance_level", label: "Clearance Level", description: "Security clearance classification" },
      { id: "designation", label: "Designation", description: "Official role and title" },
    ],
  },
  {
    id: "immigration",
    name: "Immigration Department",
    shortName: "Immigration",
    description: "Verify the identity of an immigration officer or border agent",
    iconPath: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    accentColor: "purple",
    claims: [
      { id: "full_name", label: "Full Name", description: "Legal full name of the officer" },
      { id: "officer_id", label: "Officer ID", description: "Immigration officer identifier" },
      { id: "district", label: "District / Office", description: "Assigned immigration office" },
      { id: "authorization_level", label: "Authorization Level", description: "Level of authority granted" },
      { id: "valid_until", label: "Valid Until", description: "Credential expiry date" },
    ],
  },
];

export const ACCENT_CLASSES: Record<string, { bg: string; text: string; border: string; badge: string; light: string }> = {
  blue: {
    bg: "bg-blue-600",
    text: "text-blue-600",
    border: "border-blue-600",
    badge: "bg-blue-100 text-blue-800",
    light: "bg-blue-50",
  },
  green: {
    bg: "bg-emerald-600",
    text: "text-emerald-600",
    border: "border-emerald-600",
    badge: "bg-emerald-100 text-emerald-800",
    light: "bg-emerald-50",
  },
  amber: {
    bg: "bg-amber-600",
    text: "text-amber-600",
    border: "border-amber-600",
    badge: "bg-amber-100 text-amber-800",
    light: "bg-amber-50",
  },
  purple: {
    bg: "bg-violet-600",
    text: "text-violet-600",
    border: "border-violet-600",
    badge: "bg-violet-100 text-violet-800",
    light: "bg-violet-50",
  },
};
