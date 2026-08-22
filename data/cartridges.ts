export type CartridgeDefinition = {
  name: string;
  color: string;
  label: string;
  shellOpacity?: number;
};

export const CARTRIDGES: CartridgeDefinition[] = [
  { name: "Cursor", color: "#B2B4BB", label: "/labels/cursor.png" },
  {
    name: "Vercel",
    color: "#000",
    label: "/labels/vercel.png",
    shellOpacity: 0.7,
  },
  {
    name: "GitHub",
    color: "#4A5A8A",
    label: "/labels/github.png",
    shellOpacity: 0.7,
  },
  { name: "Azure DevOps", color: "#BB9F77", label: "/labels/devops.png" },
  { name: "Microsoft", color: "#9B937C", label: "/labels/microsoft.png" },
  { name: "Tuenti", color: "#051E42", label: "/labels/tuenti.png" },
];

export const TUENTI_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/tuenti.png"
)!;

export const VERCEL_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/vercel.png"
)!;
