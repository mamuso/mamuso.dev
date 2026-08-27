"use client";

import { useEffect, useRef } from "react";

import backdropShader from "./cartridge-backdrop.wgsl";

/**
 * A static, progressively enhanced backdrop for the cartridge stage.
 * The parent supplies the same flat color as a fallback when WebGPU is absent.
 */
export default function CartridgeBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !("gpu" in navigator)) return;

    let disposed = false;
    let cleanupGpu: (() => void) | undefined;

    void (async () => {
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
          dpr: [1, 2],
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
        // WebGPU is progressive enhancement; the parent's color remains visible.
      }
    })();

    return () => {
      disposed = true;
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
