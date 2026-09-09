struct EdgeParams {
  resolution: vec2f,
  fold: f32,
  dents: f32,
}
@group(0) @binding(0) var<uniform> params: EdgeParams;
@group(0) @binding(1) var paper: texture_2d<f32>;
@group(0) @binding(2) var paperSampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.resolution;
  let far = params.resolution - p;
  // Sparse notches, confined to the unprinted outer margin.
  let leftDent = params.dents * (exp(-pow((p.y - 69.0) / 2.4, 2.0))
    + 0.65 * exp(-pow((far.y - 91.0) / 3.0, 2.0)));
  let rightDent = params.dents * exp(-pow((p.y - 143.0) / 3.5, 2.0));
  let edge = min(min(p.x - leftDent, far.x - rightDent), min(p.y, far.y));
  let fold = clamp(params.fold, 0.0, 10.0);
  let corner = far.x + p.y;
  let bottomCorner = p.x + far.y;
  let silhouette = min(edge, min(corner - fold * 0.5, bottomCorner - fold * 0.2));
  let alpha = smoothstep(0.0, 0.8, silhouette);
  let crease = exp(-abs(corner - fold) / 1.1) * 0.12 * step(0.1, fold);
  let flap = (1.0 - smoothstep(fold * 0.55, max(fold, 0.01), corner)) * 0.045;
  let edgeShade = exp(-max(edge, 0.0) / 1.2) * 0.028;
  let color = textureSampleLevel(paper, paperSampler, uv, 0.0).rgb;
  return vec4f((color - crease - edgeShade + flap) * alpha, alpha);
}
