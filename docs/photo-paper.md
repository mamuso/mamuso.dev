# Photo metadata paper

Individual photos and stack entries use `PhotoMeta` through `PhotoDetail`.
Metadata remains server-rendered HTML. The canvas paints only the paper.

## Layout

The cell is 24 CSS pixels. `PhotoMeta` rounds the available width down to a whole
cell, up to 432px, and reserves 12px of unprinted paper on each side. The grid
therefore also has an integer column count. All content line heights, vertical
gaps and total padding are multiples of 24px; wrapping adds whole rows. The date
sits in a separate unruled footer. No fixed content height, clipping or truncation
is used. CSS `round()` is required for width snapping.

## Adjusting the paper

Edit `app/components/paper-settings.ts`:

- `seed`: fixed spatial pattern, shared by every card.
- `grain`: fine noise intensity (default 0.035).
- `fibers`: elongated fiber intensity (0.018).
- `textureScale`: grain size in CSS pixels (1).
- `fold`: corner fold in CSS pixels (8; clamped to 0–10).
- `dents`: depth of edge notches in CSS pixels (1.5; clamped to 0–10).

Set fold/dents to zero to remove those imperfections. Texture is independent of
time and stays anchored in paper coordinates when the card resizes. Paper tone
is in `paper-texture.wgsl`; the matching CSS fallback is in the `photo-paper`
layer in `app/globals.css`. Grid ink and text colors live in `PhotoMeta.tsx`.

`paper-texture.wgsl` renders to an offscreen texture;
`paper-imperfections.wgsl` samples it and adds the silhouette and fold shading.
Damage is confined to the unprinted margin, preserving every grid cell.

The renderer loads near the viewport, shares a GPU device across cards and
renders only on initialization or resize. Unmount disconnects observers and
releases the surface and texture; the final card disposes the device. Device
loss or missing WebGPU restores the CSS paper. No animation loop is needed.

## Verification

Use Node 24:

```sh
pnpm typecheck
pnpm shader:check
node scripts/paper-shaders-check.mjs
```

The last command uses a real GPU to check deterministic output, opacity across
the grid area, texture preservation in the second pass and the fold control.
It writes `output/paper/shader.png` for visual inspection.

Browser checks should cover individual photos and stacks at desktop and narrow
mobile widths, long text, browser zoom/text enlargement, and missing WebGPU.
Both `[data-photo-paper]` and `[data-paper-grid]` dimensions must be divisible by
24. The date footer must have no grid background, and visible canvases should
have `data-ready="true"` when WebGPU is available.
