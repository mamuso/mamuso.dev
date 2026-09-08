# Cartridge renderer

The Three.js renderer remains the visual compatibility baseline while the vgpu
replacement is pending. Its entry point is still dynamically loaded on the homepage.

## Responsibilities

| Module | Contract |
| --- | --- |
| `CartridgeViewer.tsx` | Canvas configuration, resting-pose initialization and composition. |
| `CartridgeScene.tsx` | Cached assets, warm-up, selection, lights and item composition. |
| `cartridgeConfig.ts` | Shared physical dimensions, camera presets and animation parameters. |
| `cartridgeCamera.ts` | Projection and framing; restores the input scene's animated transforms. |
| `ResponsiveCameraRig.tsx` | Camera resize/scroll lifecycle and frame interpolation. |
| `cartridgeLayout.ts` | Resting slots and selected poses; does not mutate the input layout. |
| `useCartridgeMotion.ts` | Entrance, interruption and responsive spring state for one pivot. |
| `cartridgeSpring.ts` | Allocation-free scalar integration, preserving velocity across targets. |
| `cartridgeMaterials.ts` | Instance construction and disposal of owned materials. |
| `CartridgeItem.tsx` | Instance lifecycle, hitboxes, accessible controls and presentation. |

Presentation, sticker deformation, quality policy and mobile geometry remain in
their existing modules. Material changes do not belong in the camera/controller.

## Resource ownership

GLTF geometry and loader textures are shared cache resources. An item owns its
cloned materials and disposes those when its instance changes or unmounts. It must
not dispose shared geometry or label textures. The module-level hitbox geometry
opts out of per-mount R3F disposal. Sticker-created geometry and textures retain
their local cleanup; backdrop initialization retains its cancellation/release path.

Strict Mode is enabled. Effects must support setup, cleanup and setup again,
including asynchronous warm-up and navigation away before initialization completes.

The unused `rock`, `static`, `frozen` and `intro` variants were removed, along with
the unused `PlacePhoto` component and standalone Tuenti/Vercel exports. Live
entrance, selection, hover presentation and sticker behavior remain supported.

## Verification

- `pnpm check` includes camera, layout, interrupted spring and resource-ownership
  contracts in `cartridgeContracts.test.mjs`.
- `pnpm smoke:test` covers pointer/touch selection, keyboard interruption, Escape,
  canvas retention across a breakpoint, mobile scroll and unavailable GLB fallback.
- For visual changes, compare seeded resting poses at desktop and mobile sizes,
  closed, selected and with the sticker. Test development navigation/remounts too:
  production does not exercise Strict Mode effect replay.

The September 2026 extraction passed 40 unit tests and 18 production browser tests
at the verification snapshot, plus the metadata and function-size checks. Seeded
closed/selected captures matched pixel-for-pixel in the stage region at both
sizes; desktop sticker matched too. The mobile sticker capture had a small
timing variation. Development selection worked at both sizes with effect replay;
two navigation cycles and a reload completed without JavaScript errors.

Measured decoded homepage script responses were 1,746,116 bytes before and
1,744,318 after. Concurrent photo work also changed shared chunks, so this is not
an isolated attribution to the extraction. Treat the download size as unchanged;
file separation alone does not remove Three.js or reduce its cost.
