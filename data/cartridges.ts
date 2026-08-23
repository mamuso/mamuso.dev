export type CartridgeDefinition = {
  name: string;
  company: string;
  period?: string;
  color: string;
  label: string;
  shellOpacity?: number;
};

export const CARTRIDGES: CartridgeDefinition[] = [
  {
    name: "Cursor",
    company: "SpaceXAI",
    period: "2026 - now",
    color: "#B2B4BB",
    label: "/labels/cursor.webp",
  },
  {
    name: "Vercel",
    company: "Vercel",
    period: "2024 - 2026",
    color: "#000",
    label: "/labels/vercel.webp",
    shellOpacity: 0.7,
  },
  {
    name: "GitHub",
    company: "GitHub",
    period: "2019 - 2024",
    color: "#4A5A8A",
    label: "/labels/github.webp",
    shellOpacity: 0.7,
  },
  {
    name: "Azure DevOps",
    company: "Microsoft, Dev Services",
    period: "2018 - 2019",
    color: "#BB9F77",
    label: "/labels/devops.webp",
  },
  {
    name: "Microsoft",
    company: "Microsoft",
    period: "2013 - 2018",
    color: "#9B937C",
    label: "/labels/microsoft.webp",
  },
  {
    name: "Tuenti",
    company: "Tuenti",
    period: "2010 - 2013",
    color: "#051E42",
    label: "/labels/tuenti.webp",
  },
];

export const TUENTI_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/tuenti.webp"
)!;

export const VERCEL_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/vercel.webp"
)!;
