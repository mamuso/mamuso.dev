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

An already selected cartridge accepts a 600 ms primary-touch hold on its existing
hitbox. The hold can start while the opening spring is moving. After 600 ms the
`armed` state waits for the existing settled ref and sticker placement to finish;
releasing or moving the finger cancels it. This preserves the hold instead of
rejecting an immediate tap followed by long press.

`useCartridgeBlow` owns a nested identity group around the model and sticker,
inside presentation. Its −47° rotation and wind shake are additive: neither the
base pivot nor its spring targets/velocities are overwritten. Blow mode remains
active through any amount of blowing or silence. A second tap on the selected
cartridge stops audio and consumes the tap so the cartridge stays open. The
return preserves the current pose and measured velocity (including a partly
completed entry). `cartridgeBlowReturn.ts` reuses `advanceCartridgeSpring` for a
450 ms damped return, with less than one degree of overshoot from the full tilt.
Wind offsets retain their momentum and fade to rest over 80 ms. Integration uses
bounded substeps to stay stable across frame rates and finishes at exact identity.
The visual clock starts on the first return frame and advances by at most 33 ms
per rendered frame: slow audio teardown or a dropped frame cannot skip the
animation. On slow devices the return takes longer instead of snapping. Further taps during return are consumed. A later normal tap closes
the cartridge as usual. Reduced-motion users get the tilt/return without shake, with critical damping to prevent bounce.

`cartridgeBlow.ts` owns the gesture/audio state machine and microphone lease.
The lease survives a cancelled pending permission dialog, because getUserMedia
cannot be aborted: a late stream is stopped before releasing that lease. Tracks,
nodes and context are released on exit, audio failure, selection change, page
hiding, scrolling, navigation and unmount. The 20-second deadline only applies to
pending permission; active mode has no expiry. No audio is sent to a server or
connected to speakers. Sampling uses the existing R3F demand loop, with no audio
RAF or React state updates. Pointer movement/up/cancel listeners cover leaving
the hitbox; vertical page scrolling remains enabled. Pointerdown on the same
canvas does not reset the mode before its cartridge click handler can handle exit.

Sensitivity and timing constants live in `BLOW`. The detector smooths RMS,
calibrates ambient energy for 400 ms and combines an ambient ratio with a minimum
energy and margin. Energy drives wind intensity continuously; no duration or
silence threshold completes the interaction. This is an energy heuristic, not
speech recognition: other loud sounds also shake the cartridge.

For development-only console diagnostics, run
`localStorage.setItem('cartridge-blow-debug', '1')` and perform the gesture.
The throttled log includes state, raw RMS, smoothed energy, baseline, threshold,
intensity and sustained duration. Remove the key to disable it. The logging
branch is excluded in production; no controls or instructions are shown.

`cartridgeBlow.test.mjs` covers calibration, queued/cancelled holds, denial, late
permission, persistent listening and explicit exit. `e2e/cartridge-blow.spec.ts`
uses browser input and synthetic local audio to verify immediate tap/hold,
touch-only activation, persistence through silence, tap-to-return, microphone
shutdown and normal taps afterward. Physical iOS/Android permission behavior and
microphone sensitivity require real-device validation.

## Mobile drag navigation

`useCartridgeSwipe` starts on the selected cartridge's existing hitbox for primary
touch input in the mobile layout. It locks the gesture after 12 px: horizontal
motion must dominate vertical motion by 1.2×. Vertical/ambiguous gestures keep
native `pan-y` scrolling. A 48 px horizontal displacement on release opens one
neighbor (left → next, right → previous); first/last cartridges do not wrap.
Short or reversed drags spring back and consume their click, while ordinary taps
retain their original behavior. Pointer cancellation, multitouch, selection and
viewport changes cancel the pending gesture.

A separate additive group gives the selected model a small resisted translation
and roll while dragging, using the existing scalar spring and R3F demand loop.
No React state updates occur during movement. `CartridgeScene` owns the final
selection and uses the same poses/opening springs as taps. Horizontal intent
immediately cancels the blow hold or stops the active microphone. An active
blow pose returns through its spring rather than being zeroed, so a short drag
that does not navigate still exits smoothly. Desktop input and keyboard controls remain unchanged.

`cartridgeSwipe.test.mjs` covers direction locking, thresholds, boundaries and
cancellation. `e2e/cartridge-swipe.spec.ts` covers both directions, short/cancelled
drags, closed-rack behavior, vertical scroll and desktop preservation; the blow
browser test also verifies that dragging away releases an active microphone.
