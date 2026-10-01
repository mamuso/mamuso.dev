struct PinkParams {
  resolution: vec2f,
  time: f32,
  grain: f32,
}

@group(0) @binding(0) var<uniform> params: PinkParams;

// Integer PCG hash: float hashes show lattices at pixel scale.
fn pcg(v: vec3u) -> f32 {
  var x = v * 1664525u + 1013904223u;
  x.x += x.y * x.z;
  x.y += x.z * x.x;
  x.z += x.x * x.y;
  x ^= x >> vec3u(16u);
  x.x += x.y * x.z;
  return f32(x.x) / 4294967295.0;
}

// Film grain for the pink page, redrawn at 24 frames a second. It sits behind
// the content, so it emits premultiplied light or shadow only.
@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let pixel = vec2u(uv * params.resolution);
  let speck = pcg(vec3u(pixel, u32(params.time * 24.0))) - 0.5;
  let alpha = abs(speck) * 2.0 * params.grain;
  let color = select(vec3f(0.0), vec3f(alpha), speck > 0.0);
  return vec4f(color, alpha);
}
