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

## Secret touch interaction

An already selected, settled cartridge accepts a 600 ms primary-touch hold on its
existing hitbox. `useCartridgeMotion` exposes its existing settled ref; selection,
reflow, sticker placement and opening/closing remain its original owners.
`useCartridgeBlow` owns a nested identity group around the model and sticker,
inside presentation. Its local rotation/translation are additive, so neither the
base pivot nor its spring targets/velocities are overwritten. Completing the
1400 ms return from the −47° tilt sets the child transform exactly to identity. Reduced-motion users
get the tilt/return without shake or kick. Wind shake continues throughout the
sustained blow; the return uses a quintic ease with zero endpoint velocity and
acceleration, a softer kick and a longer shake fade.

`cartridgeBlow.ts` owns the gesture/audio state machine and microphone lease.
The lease survives a cancelled pending permission dialog, because getUserMedia
cannot be aborted: a late stream is stopped before releasing that lease. Tracks,
nodes and context are released on completion, audio failure, selection change,
page hiding, scrolling, navigation, new input and unmount. A 20-second deadline
also releases an abandoned session. No audio is sent to a server or connected to
speakers. Sampling uses the existing R3F demand loop, with no audio RAF or React
state updates. Pointer movement/up/cancel listeners cover leaving the hitbox;
vertical page scrolling remains enabled.

Sensitivity and timing constants live in `BLOW`. The detector smooths RMS,
calibrates ambient energy for 400 ms and combines an ambient ratio with a minimum
energy and margin. Both raw and smoothed energy must exceed the threshold for
2800 ms; stalled frames reset that duration. This is an energy heuristic, not
speech recognition: a sustained loud sound can also trigger it. Validate the
feel with actual phone microphones before treating sensitivity as final.

For development-only console diagnostics, run
`localStorage.setItem('cartridge-blow-debug', '1')` and perform the gesture.
The throttled log includes state, raw RMS, smoothed energy, baseline, threshold,
intensity and sustained duration. Remove the key to disable it. The logging
branch is excluded in production; no controls or instructions are shown.

`cartridgeBlow.test.mjs` covers calibration, spikes, duration, cancellation,
denial, delayed permission and resource disposal. `e2e/cartridge-blow.spec.ts`
uses trusted browser input and synthetic local audio to verify touch-only
activation, click suppression, completion, microphone shutdown and normal taps.
Physical iOS/Android permission behavior and microphone sensitivity still need a
real-device pass; synthetic audio cannot establish acoustic accuracy.
