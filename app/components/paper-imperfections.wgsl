struct EdgeParams {
  resolution: vec2f,
  seed: u32,
  foldCount: f32,
  foldSize: f32,
  foldStrength: f32,
  dents: f32,
  cornerRadius: f32,
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
  let radius = clamp(params.cornerRadius, 0.0, min(params.resolution.x, params.resolution.y) * 0.5);
  let q = abs(p - params.resolution * 0.5) - (params.resolution * 0.5 - radius);
  let roundedEdge = radius - length(max(q, vec2f(0.0))) - min(max(q.x, q.y), 0.0);
  var edge = min(min(p.x, far.x), min(p.y, far.y));
  var shading = 0.0;
  // Four different deformations, with per-photo positions and proportions.
  // All affect lighting only; text and the paper's interior remain opaque.
  let familyOffset = u32(random(701u) * 4.0);
  for (var i = 0u; i < 8u; i++) {
    if (f32(i) >= clamp(params.foldCount, 0.0, 8.0)) { break; }
    let n = i * 23u;
    let kind = (i + familyOffset) % 4u;
    let size = clamp(params.foldSize, 24.0, 220.0) * mix(0.45, 1.65, random(n + 2u));
    let strength = mix(0.45, 1.15, random(n + 3u));
    let center = mix(vec2f(0.12), vec2f(0.88), vec2f(random(n + 4u), random(n + 5u))) * params.resolution;
    let angle = random(n + 6u) * 6.2831853;
    let axis = vec2f(cos(angle), sin(angle));
    let delta = p - center;
    let across = dot(delta, axis);
    let along = dot(delta, vec2f(-axis.y, axis.x));
    if (kind == 0u) {
      // A fine, slightly curved crease, free to cross the interior.
      let width = mix(0.7, 2.4, random(n + 7u));
      let bend = mix(-0.16, 0.16, random(n + 8u));
      let d = across + bend * along * along / size;
      let envelope = exp(-pow(along / size, 4.0));
      let shadow = exp(-pow(d / width, 2.0));
      let light = exp(-pow((d - width * 1.5) / (width * 1.3), 2.0));
      shading += (light * 0.55 - shadow * 0.8) * envelope * strength;
    } else if (kind == 1u) {
      // A broad elliptical bulge: opposing slopes under a fixed upper-left light.
      let stretch = mix(0.35, 1.4, random(n + 7u));
      let x = across / (size * stretch);
      let y = along / size;
      let mound = exp(-(x * x + y * y) * 2.0);
      let lightDirection = normalize(vec2f(-0.6, -0.8));
      let slope = dot(axis, lightDirection) * x + dot(vec2f(-axis.y, axis.x), lightDirection) * y;
      shading += slope * mound * 2.5 * strength;
    } else if (kind == 2u) {
      // A small triangular corner fold, confined to the blank edge margins.
      let corner = u32(random(n + 7u) * 4.0);
      var local = p;
      if (corner == 1u || corner == 3u) { local.x = far.x; }
      if (corner >= 2u) { local.y = far.y; }
      let reach = clamp(size * mix(0.15, 0.35, random(n + 8u)), 10.0, 40.0);
      let tilt = mix(0.75, 1.3, random(n + 9u));
      let diagonal = (local.x * tilt + local.y) / sqrt(tilt * tilt + 1.0);
      let fold = reach / sqrt(tilt * tilt + 1.0);
      let d = diagonal - fold;
      let flap = 1.0 - smoothstep(-1.0, 1.0, d);
      let hinge = exp(-pow(d / 1.3, 2.0));
      let lift = exp(-pow((d - 2.0) / 2.8, 2.0));
      shading += (flap * 0.3 - hinge * 0.95 + lift * 0.4) * strength;
    } else {
      // A soft edge buckle with independently varying depth and width.
      let side = u32(random(n) * 4.0);
      var depth = p.x;
      var tangent = p.y - center.y;
      if (side == 1u) { depth = far.x; }
      if (side == 2u) { depth = p.y; tangent = p.x - center.x; }
      if (side == 3u) { depth = far.y; tangent = p.x - center.x; }
      let d = depth - size * mix(0.1, 0.6, random(n + 7u)) + tangent * mix(-0.9, 0.9, random(n + 8u));
      let softness = size * mix(0.025, 0.12, random(n + 9u));
      let envelope = exp(-pow(tangent / (size * 0.65), 2.0)) * (1.0 - smoothstep(size * 0.7, size * 1.3, depth));
      let shadow = exp(-pow(d / softness, 2.0));
      let light = exp(-pow((d - softness * 1.6) / (softness * 1.8), 2.0));
      shading += (light * 0.55 - shadow) * envelope * strength;
      let dent = clamp(params.dents, 0.0, 2.0) * exp(-pow(tangent / (size * 0.16), 2.0));
      edge = min(edge, depth - dent);
    }
  }
  let alpha = smoothstep(0.0, 0.8, min(edge, roundedEdge));
  let color = textureSampleLevel(paper, paperSampler, uv, 0.0).rgb;
  let tone = clamp(shading * clamp(params.foldStrength, 0.0, 0.12), -0.08, 0.045);
  return vec4f((color + tone) * alpha, alpha);
}
