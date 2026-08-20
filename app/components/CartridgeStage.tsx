"use client";

import { useEffect, useState } from "react";
import CartridgeViewer from "./CartridgeViewer";

// Tighter fit on large screens, roomier on small ones — both stay fully
// contained within the panel (margin >= 1 never bleeds past its edges).
export default function CartridgeStage() {
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLarge(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Remount on breakpoint change so Bounds recomputes its fit with the new margin.
  return (
    <CartridgeViewer
      key={isLarge ? "lg" : "sm"}
      margin={isLarge ? 1.4 : 1.7}
    />
  );
}
