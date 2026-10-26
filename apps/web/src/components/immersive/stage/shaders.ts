/**
 * GLSL for the particle field. The simulation runs on the GPU in two passes
 * (velocity, then position) via GPUComputationRenderer, which injects
 * `resolution`, `texturePosition` and `textureVelocity`.
 */

/* Simplex noise by Ashima Arts / Stefan Gustavson (MIT), plus a curl built on it. */
const noise = /* glsl */ `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
    i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 noise3(vec3 p) {
  return vec3(snoise(p), snoise(p + vec3(31.4, 15.9, 26.5)), snoise(p + vec3(-53.5, 89.7, -93.2)));
}

vec3 curl(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = noise3(p - dx), px1 = noise3(p + dx);
  vec3 py0 = noise3(p - dy), py1 = noise3(p + dy);
  vec3 pz0 = noise3(p - dz), pz1 = noise3(p + dz);
  float x = (py1.z - py0.z) - (pz1.y - pz0.y);
  float y = (pz1.x - pz0.x) - (px1.z - px0.z);
  float z = (px1.y - px0.y) - (py1.x - py0.x);
  return vec3(x, y, z) / (2.0 * e);
}
`

export const velocityShader = /* glsl */ `
uniform float uTime;
uniform float uDelta;
uniform float uMorph;
uniform float uSpring;
uniform float uDamping;
uniform float uNoise;
uniform float uScatter;
uniform float uPulse;
uniform vec3 uPointer;
uniform float uPointerRadius;
uniform float uPointerStrength;
uniform sampler2D uFormA;
uniform sampler2D uFormB;

${noise}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  float seed = hash(uv);

  // Particles leave in a staggered wave rather than all at once.
  float t = smoothstep(seed * 0.6, seed * 0.6 + 0.4, uMorph);
  vec3 target = mix(texture2D(uFormA, uv).xyz, texture2D(uFormB, uv).xyz, t);
  target *= 1.0 + uPulse * 0.08 * sin(uTime * 2.4 + seed * 6.2831);

  vec3 force = (target - pos) * uSpring;

  // Organic drift, stronger mid-transition so shapes dissolve and re-form.
  float transit = sin(t * 3.14159);
  force += curl(pos * 0.55 + vec3(0.0, uTime * 0.04, seed * transit)) * (uNoise + transit * uScatter);

  // Pointer pushes particles away, measured in the screen plane.
  vec2 away = pos.xy - uPointer.xy;
  float d = length(away);
  float push = (1.0 - smoothstep(0.0, uPointerRadius, d)) * uPointerStrength;
  force.xy += (away / max(d, 0.001)) * push;
  force.z += push * 0.5 * (seed - 0.5);

  // Frame-rate independent damping.
  vel = vel * pow(uDamping, uDelta * 60.0) + force * uDelta;
  gl_FragColor = vec4(vel, 1.0);
}
`

export const positionShader = /* glsl */ `
uniform float uDelta;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  gl_FragColor = vec4(pos.xyz + vel * uDelta, pos.w);
}
`

export const pointsVertex = /* glsl */ `
uniform sampler2D uPositions;
uniform sampler2D uTarget;
uniform float uDirect;
uniform float uSize;
uniform float uPixelRatio;
uniform float uTime;
uniform float uLevel;
uniform float uGlow;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform sampler2D uVideo;
uniform float uVideoMix;
// Per-particle colour (the logo ring: each logo in its brand colour).
uniform sampler2D uPalette;
uniform float uPaletteMix;

attribute vec2 reference;
attribute float aSeed;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // uDirect = 1 bypasses the simulation (motion off): particles sit on the target shape.
  vec3 p = mix(texture2D(uPositions, reference).xyz, texture2D(uTarget, reference).xyz, uDirect);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.55 + 0.45 * sin(uTime * 1.3 + aSeed * 40.0);
  gl_PointSize = uSize * uPixelRatio * (0.35 + aSeed) * (1.0 + uLevel * 1.2) / -mv.z;

  vec3 tone = mix(uColorA, uColorB, smoothstep(0.15, 0.85, aSeed * 0.7 + p.y * 0.12 + 0.2));
  // A few bright "fireflies".
  tone += step(0.985, aSeed) * uGlow;
  vec3 video = texture2D(uVideo, reference).rgb * 1.3;
  tone = mix(tone, texture2D(uPalette, reference).rgb, uPaletteMix);
  vColor = mix(tone, video, uVideoMix);
  vAlpha = mix(twinkle, 1.0, uVideoMix) * smoothstep(-16.0, -3.0, mv.z);
}
`

export const pointsFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
