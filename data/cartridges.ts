export type CartridgeDefinition = {
  name: string;
  company: string;
  period?: string;
  color: string;
  label: string;
  applicationLabel?: string;
  shellOpacity?: number;
};

export const CARTRIDGES: CartridgeDefinition[] = [
  {
    name: "Cursor",
    company: "SpaceXAI",
    period: "2026-now",
    color: "#2A2A2A",
    label: "/labels/cursor.webp",
    applicationLabel: "/labels/spacexai.webp",
    shellOpacity: 0.1,
  },
  {
    name: "Vercel",
    company: "Vercel",
    period: "2024-2026",
    color: "#303236",
    label: "/labels/vercel.webp",
  },
  {
    name: "GitHub",
    company: "GitHub",
    period: "2019-2024",
    color: "#A8B99A",
    label: "/labels/github.webp",
    shellOpacity: 0.8,
  },
  {
    name: "Azure DevOps",
    company: "Microsoft, Dev Services",
    period: "2018-2019",
    color: "#708AA2",
    label: "/labels/devops.webp",
  },
  {
    name: "Microsoft",
    company: "Microsoft",
    period: "2013-2018",
    color: "#A79F8D",
    label: "/labels/microsoft.webp",
  },
  {
    name: "Tuenti",
    company: "Tuenti",
    period: "2010-2013",
    color: "#1452A3",
    label: "/labels/tuenti.webp",
    shellOpacity: 0.8,
  },
];

export const TUENTI_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/tuenti.webp"
)!;

export const VERCEL_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/vercel.webp"
)!;
