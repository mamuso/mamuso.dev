struct BackdropParams {
  resolution: vec2f,
}

@group(0) @binding(0) var<uniform> params: BackdropParams;

fn grain(pixel: vec2f) -> f32 {
  let value = dot(pixel, vec2f(12.9898, 78.233));
  return fract(sin(value) * 43758.5453);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let safeHeight = max(params.resolution.y, 1.0);
  let aspect = params.resolution.x / safeHeight;
  let centered = (uv - vec2f(0.5)) * vec2f(aspect, 1.0);
  let distanceFromCenter = length(centered);

  let verticalLight = mix(0.008, -0.008, uv.y);
  let centerLight = exp(-dot(centered, centered) * 1.8) * 0.012;
  let vignette = smoothstep(0.35, 1.05, distanceFromCenter) * 0.012;
  let pixel = floor(uv * params.resolution);
  let paperGrain = (grain(pixel) - 0.5) * 0.006;

  let horizontalFeather =
    smoothstep(0.0, 0.12, uv.x) * smoothstep(0.0, 0.12, 1.0 - uv.x);
  let verticalFeather =
    smoothstep(0.0, 0.12, uv.y) * smoothstep(0.0, 0.12, 1.0 - uv.y);
  let edgeFeather = horizontalFeather * verticalFeather;
  let overlay =
    (verticalLight + centerLight - vignette + paperGrain) * edgeFeather;
  let isHighlight = overlay >= 0.0;

  // The page behind this canvas is a textured composite, not a flat color.
  // Emit premultiplied light or shadow only, so that composite remains visible.
  let shadowAlpha = clamp(-overlay / 0.9, 0.0, 0.04);
  let highlightAlpha = clamp(overlay / 0.1, 0.0, 0.12);
  let alpha = select(shadowAlpha, highlightAlpha, isHighlight);
  let premultipliedColor = select(vec3f(0.0), vec3f(alpha), isHighlight);
  return vec4f(premultipliedColor, alpha);
}
