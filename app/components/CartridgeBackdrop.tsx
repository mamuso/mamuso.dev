"use client";

import { useEffect, useRef } from "react";

import backdropShader from "./cartridge-backdrop.wgsl";

/**
 * A static, progressively enhanced lighting overlay for the cartridge stage.
 * It initializes after the hero's critical load and leaves the page background visible.
 */
export default function CartridgeBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !("gpu" in navigator)) return;

    let disposed = false;
    let cleanupGpu: (() => void) | undefined;
    let idleCallbackId: number | undefined;
    let startupDelayId: number | undefined;

    const initialize = async () => {
      try {
        const { effect, frame, init, surface } = await import("vgpu");
        if (disposed) return;

        const gpu = await init();
        let backdropSurface: ReturnType<typeof surface> | undefined;
        let resizeObserver: ResizeObserver | undefined;
        let released = false;
        const releaseGpu = () => {
          if (released) return;
          released = true;
          resizeObserver?.disconnect();
          backdropSurface?.dispose();
          gpu.dispose();
        };
        cleanupGpu = releaseGpu;

        if (disposed) {
          releaseGpu();
          return;
        }

        backdropSurface = surface(gpu, canvas, {
          alphaMode: "premultiplied",
          clearColor: [0, 0, 0, 0],
          dpr: 1,
          label: "cartridge-backdrop",
        });
        const backdrop = effect(gpu, backdropShader, {
          label: "cartridge-backdrop",
          set: {
            params: { resolution: backdropSurface.size },
          },
        });

        await backdrop.compile(backdropSurface);
        if (disposed) {
          releaseGpu();
          return;
        }

        const render = () => {
          frame(gpu, (currentFrame) => {
            backdrop.set({
              params: { resolution: backdropSurface.size },
            });
            currentFrame.pass(backdropSurface, backdrop);
          });
        };

        resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(canvas);
        render();
      } catch {
        cleanupGpu?.();
        // WebGPU is progressive enhancement; the page background remains visible.
      }
    };

    const scheduleInitialization = () => {
      startupDelayId = window.setTimeout(() => {
        if (disposed) return;
        if ("requestIdleCallback" in window) {
          idleCallbackId = window.requestIdleCallback(
            () => void initialize(),
            { timeout: 1500 }
          );
          return;
        }
        void initialize();
      }, 2000);
    };

    if (document.readyState === "complete") {
      scheduleInitialization();
    } else {
      window.addEventListener("load", scheduleInitialization, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener("load", scheduleInitialization);
      if (startupDelayId !== undefined) window.clearTimeout(startupDelayId);
      if (idleCallbackId !== undefined) window.cancelIdleCallback(idleCallbackId);
      cleanupGpu?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        height: "100%",
        inset: 0,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
      }}
    />
  );
}
