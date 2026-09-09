# Photo metadata paper

Individual photos and stack entries use `PhotoMeta` through `PhotoDetail`.
Metadata remains server-rendered HTML. The canvas paints only the paper.

## Layout

The cell is 24 CSS pixels. `PhotoMeta` rounds the available width down to a whole
cell, up to 432px. The grid runs full bleed to the paper edges and has an
integer column count. The silhouette clips the print at its prominent 32px
rounded corners; this intentional curved trim does not change the cell sizing. All content line heights, vertical
gaps and total padding are multiples of 24px; wrapping adds whole rows. The date
sits in a separate unruled footer. No fixed content height, clipping or truncation
is used. CSS `round()` is required for width snapping.

The paper base is `#E4E4E9` in both WGSL and the CSS fallback, with white grid
lines. Its six-layer shadow uses the negative-spread values from
[Derek Briggs' CodePen](https://codepen.io/DerekBriggs/pen/bGzXmvL):
a 1px outline followed by 1, 3, 6, 12 and 24px shadows at 6% black opacity.

## Adjusting the paper

Edit `app/components/paper-settings.ts`:

- `seed`: fixed spatial pattern, shared by every card.
- `grain`: fine noise intensity (default 0.035).
- `fibers`: elongated fiber intensity (0.018).
- `textureScale`: grain size in CSS pixels (1).
- `foldCount`: number of broad creases (4; clamped to 0–8).
- `foldSize`: nominal crease size in CSS pixels (112; clamped to 24–220).
- `foldStrength`: crease contrast (0.024; clamped to 0–0.05).
- `dents`: shallow edge wear depth in CSS pixels (0.3; clamped to 0–2).

Set `foldStrength` and `dents` to zero to remove wear; `foldCount: 0` disables
all imperfections. Positions, angles and size variation are seeded from the
photo slug, so each photo has its own repeatable wear pattern. The same photo
keeps that pattern between individual and stack views. Texture is independent of
time and stays anchored in paper coordinates when the card resizes. Paper tone
is in `paper-texture.wgsl`; the matching CSS fallback is in the `photo-paper`
layer in `app/globals.css`. Grid ink and text colors live in `PhotoMeta.tsx`.

`paper-texture.wgsl` renders to an offscreen texture;
`paper-imperfections.wgsl` samples it and adds the silhouette and fold shading.
Edge wear follows the rounded silhouette; broad creases shade the paper gently
without cutting into the text area. Fold positions adapt to the available size.
The 32px corner radius is shared by the CSS clipping in `PhotoMeta.tsx` and
the rounded silhouette calculation in `paper-imperfections.wgsl`.

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
the text area, unchanged grain between photos, different wear seeds, and broad
low-contrast shading with independent count, size and strength controls.
It writes `output/paper/shader.png` for visual inspection.

Browser checks should cover individual photos and stacks at desktop and narrow
mobile widths, long text, browser zoom/text enlargement, and missing WebGPU.
Both `[data-photo-paper]` and `[data-paper-grid]` dimensions must be divisible by
24. The date footer must have no grid background, and visible canvases should
have `data-ready="true"` when WebGPU is available.
