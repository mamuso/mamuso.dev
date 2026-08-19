export type CartridgeDefinition = {
  color: string;
  label: string;
  shellOpacity?: number;
};

export const CARTRIDGES: CartridgeDefinition[] = [
  { color: "#B2B4BB", label: "/labels/cursor.png" },
  { color: "#000", label: "/labels/vercel.png", shellOpacity: 0.7 },
  { color: "#4A5A8A", label: "/labels/github.png", shellOpacity: 0.7 },
  { color: "#BB9F77", label: "/labels/devops.png" },
  { color: "#9B937C", label: "/labels/microsoft.png" },
  { color: "#051E42", label: "/labels/tuenti.png" },
];

export const TUENTI_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/tuenti.png"
)!;

export const VERCEL_CARTRIDGE = CARTRIDGES.find(
  (cartridge) => cartridge.label === "/labels/vercel.png"
)!;
