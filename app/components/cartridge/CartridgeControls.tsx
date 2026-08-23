"use client";

import type { KeyboardEvent } from "react";
import type { CartridgeDefinition } from "@/data/cartridges";

export function CartridgeControls({
  cartridges,
  openIndex,
  onOpenIndexChange,
}: {
  cartridges: CartridgeDefinition[];
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
}) {
  const openCartridge = openIndex === null ? null : cartridges[openIndex];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || openIndex === null) return;

    event.preventDefault();
    onOpenIndexChange(null);
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-4 bottom-5 z-10 flex flex-wrap justify-center gap-2 opacity-0 transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 motion-reduce:transition-none min-[720px]:bottom-7"
      role="group"
      aria-label="Career cartridges"
      aria-describedby="cartridge-controls-help cartridge-selection-status"
      onKeyDown={handleKeyDown}
    >
      <span id="cartridge-controls-help" className="sr-only">
        Choose a company to open its cartridge. Press Escape to close it.
      </span>
      {cartridges.map((cartridge, index) => {
        const isOpen = index === openIndex;

        return (
          <button
            key={cartridge.label}
            type="button"
            className="touch-manipulation rounded-full border border-black/15 bg-white/85 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm transition-[background-color,border-color,color,box-shadow] hover:border-black/30 hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black motion-reduce:transition-none aria-pressed:border-black aria-pressed:bg-black aria-pressed:text-white"
            aria-label={`${isOpen ? "Close" : "Open"} ${cartridge.name} cartridge`}
            aria-pressed={isOpen}
            onClick={() => onOpenIndexChange(isOpen ? null : index)}
          >
            {cartridge.name}
          </button>
        );
      })}
      <span id="cartridge-selection-status" className="sr-only" aria-live="polite">
        {openCartridge
          ? `${openCartridge.name} cartridge open.`
          : "All cartridges closed."}
      </span>
    </div>
  );
}
