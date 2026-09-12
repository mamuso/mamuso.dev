# Photo metadata paper

Individual photos and stack entries use `PhotoMeta` through `PhotoDetail`.
Metadata remains server-rendered HTML. The canvas paints only the paper.

Cards use Courier Prime Regular (400) at 16px, scoped to `PhotoMeta` with
`next/font/local`. The full Regular and Bold (700) fonts and their SIL Open Font
License are stored in `app/fonts/courier-prime`, downloaded from the Google Fonts
repository. There is no 500 face. Fonts use `display: swap` with Courier New,
Courier and monospace fallbacks; builds and visits require no Google requests.

## Layout

At desktop widths (1080px and above), each photo occupies a full detail row,
including within stacks. Landscape and square images fill the 960px content
width (936px image plus its white frame). The centered landscape card tucks
24px underneath the frame, with a downward photo shadow separating the layers.
Its content starts 56px into the paper (first text baseline at 72px). A 240px
title column allows wrapping but clips the dashed underline to a single line;
a 48px gutter separates it from the metadata, date and palette column.
Portrait images are 580px wide plus two 12px frame borders. Their metadata sits
to the right, 40px below the photo top, with its left edge tucked beneath the
photo. Content is inset 72px to remain visible; the photo casts a directional
shadow over the paper.
Images retain their original aspect ratio and are never cropped. The photo has
the higher stacking order. Stack details have an 80px gap. Smaller viewports
retain the previous layout pending a separate mobile design pass.

The paper uses a 24px square grid, with white lines at 80% opacity and a
`#E4E4E9` base in both WGSL and CSS. Its width snaps down to complete cells,
up to 432px by default. On desktop, landscape cards expand to 720px below the
photo; portrait cards fit the right-hand column (currently 384px).
`PhotoDetail` passes the variant explicitly. Height follows content and corners
have a 4px radius.
No outer grid lines are drawn at the top, left or right.

Each card rotates between -2 and +2 degrees using a deterministic hash of its
photo slug, keeping the same angle in detail and stack views. The renderer sizes
its canvas from layout dimensions so rotation does not distort the paper texture.

Text starts 24px from the left. Top padding is 32px and bottom padding is 40px,
so Courier Prime's first baseline sits at 48px and wrapping adds complete rows.
The title is followed by one dash per character (including spaces), then a blank
row. Camera, exposure and coordinates occupy consecutive lines; `Taken on` and
the date follow after another blank row. The palette follows the date after a
blank row, inside the grid. A separate empty 48px footer remains below the grid,
with a white separator.

The six-layer negative-spread shadow uses a 1px outline and offsets of 1, 2, 4,
9 and 18px, all at 4.5% black opacity.

## Adjusting the paper

Edit `app/components/paper-settings.ts`:

- `seed`: fixed spatial pattern, shared by every card.
- `grain`: fine noise intensity (default 0.035).
- `fibers`: elongated fiber intensity (0.018).
- `textureScale`: grain size in CSS pixels (1).
- `foldCount`: number of deformations (4; clamped to 0–8). Each group of four
  includes a thin crease, broad bulge, corner fold and edge buckle.
- `foldSize`: nominal crease size in CSS pixels (112; clamped to 24–220).
- `foldStrength`: crease contrast (0.03; clamped to 0–0.12).
- `dents`: shallow edge wear depth in CSS pixels (0.3; clamped to 0–2).

Set `foldStrength` and `dents` to zero to remove wear; `foldCount: 0` disables
all imperfections. Positions, angles, widths, strengths and size variation are seeded from the
photo slug, so each photo has its own repeatable wear pattern. The same photo
keeps that pattern between individual and stack views. Texture is independent of
time and stays anchored in paper coordinates when the card resizes. Paper tone
is in `paper-texture.wgsl`; the matching CSS fallback is in the `photo-paper`
layer in `app/globals.css`. Grid ink and text colors live in `PhotoMeta.tsx`.

`paper-texture.wgsl` renders to an offscreen texture;
`paper-imperfections.wgsl` samples it and adds the silhouette and fold shading.
Four deformation families vary the lighting: fine curved interior creases,
broad elliptical bulges, small triangular corner folds, and soft edge buckles.
Corner folds are a lighting illusion confined to the margins, not folded mesh
geometry. The paper stays opaque across the text. Fold positions adapt to size,
and dimensions vary from 0.45 to 1.65 times the nominal fold size.
The corner radius comes from `PAPER_SETTINGS.cornerRadius` (4px), shared by the CSS clipping in `PhotoMeta.tsx` and
the rounded silhouette calculation in `paper-imperfections.wgsl`.

The renderer loads near the viewport, shares a GPU device across cards and
renders only on initialization or actual size changes. Leaving the 200px viewport
margin or unmounting releases the surface and texture; the final active card
disposes the device. Re-entry reconstructs the same deterministic paper. Device
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
bounded shading with independent count, size and strength controls. It also
checks that default folds have less than 60% of the contrast of the old 0.075 setting.
It writes `output/paper/shader.png` plus a four-photo contact sheet at
`output/paper/variety.png` for visual inspection.

Browser checks should cover individual photos and stacks at desktop and narrow
mobile widths, long text, browser zoom/text enlargement, and missing WebGPU.
Card and grid dimensions must be divisible by 24. The palette footer has no grid. The date must appear after the camera metadata, and visible canvases should
have `data-ready="true"` when WebGPU is available.

Palette colors use 25 precalculated, lossless PNG alpha masks, coloured with CSS.
The masks retain the layered diagonal strokes, varying pressure and paper grain
of the original rasterizer. Each photo uses a deterministic shuffle: palettes
with up to 20 colours have no repeated shapes. The 34px samples keep their 29px
spacing, 48px row, 0.95 opacity and ±2° rotation; longer palettes wrap naturally.
The swatches are server-rendered with no client components, canvas, observers or
pigment calculations. Browsers reuse the same assets across colours and photos.

Regenerate checked-in masks with `node scripts/palette-textures.mjs` (Node 24).
`tests/palette-textures.test.mjs` verifies pixel-exact mask regeneration and
nonrepeating selection. `app/components/paper-renderer.test.mjs` exercises resize
deduplication, shared-device lifetime, cancellation, and stale device-loss events
with a simulated GPU API; shader rendering is checked separately on real WebGPU.
