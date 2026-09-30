struct PaperParams {
  resolution: vec2f,
  scale: f32,
  seed: f32,
  grain: f32,
  fibers: f32,
}
@group(0) @binding(0) var<uniform> params: PaperParams;

// Fixed spatial noise: no clock, random initialization, or viewport normalization.
fn hash(p: vec2f) -> f32 {
  var q = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  q += dot(q, q.yzx + 33.33 + params.seed);
  return fract((q.x + q.y) * q.z);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.resolution / max(params.scale, 0.1);
  let grain = hash(floor(p * 1.8)) - 0.5;
  let fibers = hash(floor(p * vec2f(0.14, 2.2))) - 0.5;
  let cloud = (hash(floor(p / 18.0)) - 0.5) * 0.002;
  let shade = grain * params.grain + fibers * params.fibers + cloud;
  return vec4f(vec3f(228.0, 228.0, 233.0) / 255.0 + shade, 1.0);
}
