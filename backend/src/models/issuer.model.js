const ISSUERS = [
  {
    id: "police",
    name: "Police Department",
    description: "Verify the identity and credentials of a police officer",
    claims: [
      { id: "full_name", label: "Full Name" },
      { id: "badge_number", label: "Badge Number" },
      { id: "rank", label: "Rank" },
      { id: "precinct", label: "Precinct / Unit" },
      { id: "jurisdiction", label: "Jurisdiction" },
      { id: "service_since", label: "Service Since" },
    ],
  },
  {
    id: "tax",
    name: "Income Tax Department",
    description: "Verify the identity of an income tax official or inspector",
    claims: [
      { id: "full_name", label: "Full Name" },
      { id: "employee_id", label: "Employee ID" },
      { id: "designation", label: "Designation" },
      { id: "division", label: "Division" },
      { id: "authorization_level", label: "Authorization Level" },
      { id: "valid_until", label: "Valid Until" },
    ],
  },
  {
    id: "customs",
    name: "Customs Authority",
    description: "Verify the credentials of a customs or border control officer",
    claims: [
      { id: "full_name", label: "Full Name" },
      { id: "officer_id", label: "Officer ID" },
      { id: "port_of_duty", label: "Port of Duty" },
      { id: "clearance_level", label: "Clearance Level" },
      { id: "designation", label: "Designation" },
    ],
  },
  {
    id: "immigration",
    name: "Immigration Department",
    description: "Verify the identity of an immigration officer or border agent",
    claims: [
      { id: "full_name", label: "Full Name" },
      { id: "officer_id", label: "Officer ID" },
      { id: "district", label: "District / Office" },
      { id: "authorization_level", label: "Authorization Level" },
      { id: "valid_until", label: "Valid Until" },
    ],
  },
];

const getAll = () => ISSUERS;

const getById = (id) => ISSUERS.find((i) => i.id === id) || null;

module.exports = { getAll, getById };
