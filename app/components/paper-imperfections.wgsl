struct EdgeParams {
  resolution: vec2f,
  seed: u32,
  foldCount: f32,
  foldSize: f32,
  foldStrength: f32,
  dents: f32,
}
@group(0) @binding(0) var<uniform> params: EdgeParams;
@group(0) @binding(1) var paper: texture_2d<f32>;
@group(0) @binding(2) var paperSampler: sampler;

fn random(index: u32) -> f32 {
  var h = params.seed ^ (index * 747796405u + 2891336453u);
  h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;
  h = (h >> 22u) ^ h;
  return f32(h & 0x00ffffffu) / 16777216.0;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.resolution;
  let far = params.resolution - p;
  let radius = min(32.0, min(params.resolution.x, params.resolution.y) * 0.5);
  let q = abs(p - params.resolution * 0.5) - (params.resolution * 0.5 - radius);
  let roundedEdge = radius - length(max(q, vec2f(0.0))) - min(max(q.x, q.y), 0.0);
  var edge = min(min(p.x, far.x), min(p.y, far.y));
  var shading = 0.0;
  // Broad, softly lit creases, independently placed and angled per photo.
  // No time input: a photo keeps its wear through navigation and resize.
  for (var i = 0u; i < 8u; i++) {
    if (f32(i) >= clamp(params.foldCount, 0.0, 8.0)) { break; }
    let n = i * 9u;
    let side = u32(random(n) * 4.0);
    var depth = p.x;
    var along = p.y;
    var extent = params.resolution.y;
    if (side == 1u) { depth = far.x; }
    if (side == 2u) { depth = p.y; along = p.x; extent = params.resolution.x; }
    if (side == 3u) { depth = far.y; along = p.x; extent = params.resolution.x; }
    let center = mix(0.12, 0.88, random(n + 1u)) * extent;
    let size = clamp(params.foldSize, 24.0, 220.0) * mix(0.7, 1.3, random(n + 2u));
    let tangent = along - center;
    let tilt = mix(-0.65, 0.65, random(n + 3u));
    let distance = depth - size * mix(0.22, 0.48, random(n + 4u)) + tangent * tilt;
    let softness = size * 0.065;
    let envelope = exp(-pow(tangent / (size * 0.65), 2.0))
      * (1.0 - smoothstep(size * 0.65, size * 1.1, depth));
    let shadow = exp(-pow(distance / softness, 2.0));
    let light = exp(-pow((distance - softness * 1.6) / (softness * 1.8), 2.0));
    shading += (light * 0.55 - shadow) * envelope * mix(0.65, 1.0, random(n + 5u));
    // Wider, shallower edge wear replaces the small sharp notches.
    let dent = clamp(params.dents, 0.0, 2.0) * exp(-pow(tangent / (size * 0.16), 2.0));
    edge = min(edge, depth - dent);
  }
  let alpha = smoothstep(0.0, 0.8, min(edge, roundedEdge));
  let color = textureSampleLevel(paper, paperSampler, uv, 0.0).rgb;
  let tone = clamp(shading * clamp(params.foldStrength, 0.0, 0.05), -0.035, 0.02);
  return vec4f((color + tone) * alpha, alpha);
}
