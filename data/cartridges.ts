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
    color: "#303236",
    label: "/labels/cursor.png",
  },
  {
    name: "Vercel",
    company: "Vercel",
    period: "2024 - 2026",
    color: "#2A2A2A",
    label: "/labels/vercel.png",
    shellOpacity: 0.1,
  },
  {
    name: "GitHub",
    company: "GitHub",
    period: "2019 - 2024",
    color: "#4A5A8A",
    label: "/labels/github.png",
    shellOpacity: 0.7,
  },
  {
    name: "Azure DevOps",
    company: "Microsoft, Dev Services",
    period: "2018 - 2019",
    color: "#687887",
    label: "/labels/devops.png",
  },
  {
    name: "Microsoft",
    company: "Microsoft",
    period: "2013 - 2018",
    color: "#A79F8D",
    label: "/labels/microsoft.png",
  },
  {
    name: "Tuenti",
    company: "Tuenti",
    period: "2010 - 2013",
    color: "#1452A3",
    label: "/labels/tuenti.png",
    shellOpacity: 0.8,
  },
];

export const TUENTI_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/tuenti.png"
)!;

export const VERCEL_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/vercel.png"
)!;
