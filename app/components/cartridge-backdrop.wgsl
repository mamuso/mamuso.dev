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

  let base = vec3f(0.945);
  let color = base + verticalLight + centerLight - vignette + paperGrain;
  return vec4f(color, 1.0);
}
