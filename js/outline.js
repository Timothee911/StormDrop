// Post-traitement : la scène est rendue une fois dans une cible HDR, puis une passe plein écran lit
// couleur + profondeur et pose les contours, l'occlusion ambiante (ombres de contact), la brume
// lointaine, le halo des lumières vives, les rayons du soleil, l'étalonnage et un vignettage doux.
// Contours : dérivée seconde de 1/z, nulle sur une surface plane, donc seules les vraies arêtes sont tracées.
import * as THREE from 'three';

const VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const VIEWZ = `float viewZ(float d) { float z = d * 2.0 - 1.0; return 2.0 * cNear * cFar / (cFar + cNear - z * (cFar - cNear)); }`;
const FS = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform vec2 texel; uniform float cNear; uniform float cFar; uniform float thick;
uniform vec3 lineColor; uniform float strength; uniform float fadeNear; uniform float fadeFar; uniform float useAlpha;
#ifdef FX
uniform sampler2D tBloomA; uniform sampler2D tBloomB; uniform sampler2D tRays;
uniform vec3 hazeCol; uniform vec3 sunCol; uniform vec3 sunUV; uniform float hazeK; uniform float bloomK; uniform float raysK; uniform float aspect; uniform float nightK; uniform float seed;
#ifdef AO
uniform sampler2D tAO; uniform vec2 aoTexel;
#endif
#endif
varying vec2 vUv;
${VIEWZ}
void main() {
  vec4 c = texture2D(tColor, vUv);
  vec2 o = texel * thick;
  float z0 = viewZ(texture2D(tDepth, vUv).x);
  float zl = viewZ(texture2D(tDepth, vUv - vec2(o.x, 0.0)).x);
  float zr = viewZ(texture2D(tDepth, vUv + vec2(o.x, 0.0)).x);
  float zd = viewZ(texture2D(tDepth, vUv - vec2(0.0, o.y)).x);
  float zu = viewZ(texture2D(tDepth, vUv + vec2(0.0, o.y)).x);
  // creases + silhouettes: laplacian of inverse depth, relative to the centre pixel
  float w0 = 1.0 / z0;
  float lap = abs(1.0 / zl + 1.0 / zr + 1.0 / zu + 1.0 / zd - 4.0 * w0) * z0;
  // silhouettes: pixel is in front of a neighbour that is much further away
  float zmax = max(max(zl, zr), max(zu, zd));
  float sil = (zmax - z0) / z0;
  #ifdef FX
  float e = max(smoothstep(0.04, 0.14, lap) * 0.5, smoothstep(0.08, 0.3, sil)); // arêtes intérieures plus légères que la silhouette
  #else
  float e = max(smoothstep(0.03, 0.12, lap), smoothstep(0.06, 0.25, sil));
  #endif
  e *= 1.0 - smoothstep(fadeNear, fadeFar, z0);
  e *= step(z0, cFar * 0.98);
  e *= strength;
  if (useAlpha < 0.5) e *= smoothstep(0.15, 0.7, c.a); // alpha 0 : herbe, feuillage, pas de trait
  vec3 col = c.rgb;
  #ifdef FX
  // netteté : compense une image calculée un peu moins fine que l'écran
  vec3 nb = texture2D(tColor, vUv + vec2(texel.x, 0.0)).rgb + texture2D(tColor, vUv - vec2(texel.x, 0.0)).rgb + texture2D(tColor, vUv + vec2(0.0, texel.y)).rgb + texture2D(tColor, vUv - vec2(0.0, texel.y)).rgb;
  col = max(col + clamp((col * 4.0 - nb) * mix(0.05, 0.11, c.a), -0.08, 0.08), 0.0);
  #ifdef AO
  vec2 ao2 = texture2D(tAO, vUv).rg * 0.36;
  ao2 += (texture2D(tAO, vUv + aoTexel * vec2(1.5, 0.5)).rg + texture2D(tAO, vUv + aoTexel * vec2(-0.5, 1.5)).rg + texture2D(tAO, vUv + aoTexel * vec2(-1.5, -0.5)).rg + texture2D(tAO, vUv + aoTexel * vec2(0.5, -1.5)).rg) * 0.16;
  col *= mix(vec3(0.3, 0.3, 0.42), vec3(1.0), ao2.r);
  #endif
  // contour teinté : la couleur de l'objet, très assombrie (jamais un noir dur)
  col = mix(col, col * 0.16 + lineColor * 0.5, e);
  float sky = step(cFar * 0.98, z0);
  // brume : les lointains prennent la couleur de l'horizon, plus chaude du côté du soleil
  vec2 sd = (vUv - sunUV.xy) * vec2(aspect, 1.0);
  float toSun = exp(-dot(sd, sd) * 2.2) * sunUV.z;
  float hz = (1.0 - exp(-max(z0 - 60.0, 0.0) / 760.0)) * hazeK * (1.0 - sky);
  col = mix(col, hazeCol + sunCol * toSun * 0.16, hz);
  // halo des lumières vives + rayons du soleil
  vec3 bl = texture2D(tBloomA, vUv).rgb * 0.55 + texture2D(tBloomB, vUv).rgb * 0.75;
  col += bl * bloomK;
  col += sunCol * texture2D(tRays, vUv).r * raysK;
  // étalonnage : ombres légèrement bleutées, hautes lumières chaudes, couleurs plus franches
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, 1.06);
  col.g -= max(col.g - max(col.r, col.b), 0.0) * 0.07; // verts moins acides
  col *= mix(vec3(0.95, 0.985, 1.07), vec3(1.035, 1.005, 0.955), smoothstep(0.04, 0.75, l));
  col = max(col, 0.0);
  vec2 vg = (vUv - 0.5) * vec2(1.0, 0.9);
  col *= 1.06 - dot(vg, vg) * 0.36;
  #else
  // light grade: a touch more saturation for the sunny cartoon look
  vec3 g = mix(vec3(dot(c.rgb, vec3(0.2126, 0.7152, 0.0722))), c.rgb, 1.05);
  col = mix(max(g, 0.0), lineColor, e);
  #endif
  float a = useAlpha > 0.5 ? max(c.a, e) : 1.0;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #ifdef FX
  gl_FragColor.rgb += (fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0; // tramage : pas de bandes dans le ciel
  #endif
}`;
// quart de résolution : rgb = ce qui dépasse la lumière normale, a = ciel visible (pour les rayons du soleil)
const FS_BRIGHT = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 texel; varying vec2 vUv;
void main() {
  vec3 s = vec3(0.0); float sky = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 u = vUv + texel * vec2(i < 2 ? -1.0 : 1.0, (i == 0 || i == 2) ? -1.0 : 1.0);
    vec3 c = min(texture2D(tColor, u).rgb, vec3(6.0)); float l = max(c.r, max(c.g, c.b));
    s += c * smoothstep(1.15, 2.1, l); sky += step(0.99999, texture2D(tDepth, u).x) * min(l, 1.6);
  }
  gl_FragColor = vec4(s * 0.25, sky * 0.25);
}`;
const FS_BLUR = `
precision highp float;
uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv;
void main() {
  vec4 s = texture2D(tSrc, vUv) * 0.2270;
  s += (texture2D(tSrc, vUv + dir * 1.3846) + texture2D(tSrc, vUv - dir * 1.3846)) * 0.3162;
  s += (texture2D(tSrc, vUv + dir * 3.2308) + texture2D(tSrc, vUv - dir * 3.2308)) * 0.0703;
  gl_FragColor = s;
}`;
const FS_RAYS = `
precision highp float;
uniform sampler2D tSrc; uniform vec3 sunUV; uniform float aspect; varying vec2 vUv;
void main() {
  vec2 d = (sunUV.xy - vUv) / 14.0, u = vUv + d * fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
  float s = 0.0, w = 1.0;
  for (int i = 0; i < 14; i++) { s += textureLod(tSrc, u, 0.0).a * w; w *= 0.93; u += d; }
  vec2 q = (vUv - sunUV.xy) * vec2(aspect, 1.0);
  gl_FragColor = vec4(s / 14.0 * exp(-dot(q, q) * 4.2) * sunUV.z, 0.0, 0.0, 1.0);
}`;
// occlusion ambiante, demi-résolution : 1/z est affine sur un plan, donc tout échantillon devant ce plan est un vrai relief
const FS_AO = `
precision highp float;
uniform sampler2D tDepth; uniform sampler2D tColor; uniform vec2 texel; uniform float cNear; uniform float cFar; uniform float proj; varying vec2 vUv;
${VIEWZ}
float W(vec2 u) { return 1.0 / viewZ(textureLod(tDepth, u, 0.0).x); }
void main() {
  float w0 = W(vUv), z0 = 1.0 / w0;
  if (z0 > 70.0) { gl_FragColor = vec4(1.0); return; }
  vec2 tx = vec2(texel.x, 0.0), ty = vec2(0.0, texel.y);
  float a = W(vUv + tx) - w0, b = w0 - W(vUv - tx), c = W(vUv + ty) - w0, d = w0 - W(vUv - ty);
  vec2 g = vec2(abs(a) < abs(b) ? a : b, abs(c) < abs(d) ? c : d);
  float R = clamp(0.62 * proj * w0, 4.0, 54.0);                          // ~60 cm dans le monde, en pixels
  float ang = 6.2832 * fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
  float occ = 0.0;
  for (int i = 0; i < SAMPLES; i++) {
    float fi = (float(i) + 0.5) / float(SAMPLES), r = R * fi; ang += 2.39996;
    vec2 off = floor(vec2(cos(ang), sin(ang)) * r + 0.5);
    float dz = (W(vUv + off * texel) - (w0 + dot(g, off))) * z0 * z0;   // ~ mètres devant le plan
    occ += smoothstep(0.02 + z0 * 0.004, 0.22 + z0 * 0.006, dz) * (1.0 - smoothstep(0.5, 1.1, dz));
  }
  occ = occ / float(SAMPLES) * (1.0 - smoothstep(40.0, 70.0, z0)) * mix(0.5, 1.0, smoothstep(0.1, 0.8, texture2D(tColor, vUv).a));
  gl_FragColor = vec4(1.0 - clamp(occ * 1.5, 0.0, 0.9), 0.0, 0.0, 1.0);
}`;

export function createOutline(renderer, opts = {}) {
  const gl2 = renderer.capabilities.isWebGL2, fx = !!opts.fx && gl2, ao = fx ? opts.ao ?? 8 : 0;
  const dt = new THREE.DepthTexture(1, 1); dt.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: gl2 ? (opts.samples ?? 4) : 0, depthTexture: dt, depthBuffer: true });
  const small = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const T = fx ? { a: small(), b: small(), c: small(), d: small(), r: small() } : null;
  const aoRT = ao ? new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }) : null;
  const sunUV = new THREE.Vector3(0.5, 0.5, 0);
  const defines = {}; if (fx) defines.FX = 1; if (ao) defines.AO = 1;
  const mat = new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false, defines,
    transparent: !!opts.alpha, premultipliedAlpha: !!opts.alpha,
    uniforms: {
      tColor: { value: rt.texture }, tDepth: { value: dt }, texel: { value: new THREE.Vector2() },
      cNear: { value: 0.1 }, cFar: { value: 1000 }, thick: { value: 1 },
      lineColor: { value: new THREE.Color(opts.color ?? 0x0d0a24) }, strength: { value: opts.strength ?? 0.9 },
      fadeNear: { value: opts.fadeNear ?? 60 }, fadeFar: { value: opts.fadeFar ?? 220 }, useAlpha: { value: opts.alpha ? 1 : 0 },
      tBloomA: { value: T && T.a.texture }, tBloomB: { value: T && T.c.texture }, tRays: { value: T && T.r.texture }, tAO: { value: aoRT && aoRT.texture }, aoTexel: { value: new THREE.Vector2() },
      hazeCol: { value: new THREE.Color(0xbfe6ff) }, sunCol: { value: new THREE.Color(1, 0.86, 0.62) }, sunUV: { value: sunUV }, hazeK: { value: 0.5 }, bloomK: { value: 0.5 }, raysK: { value: 0.4 }, aspect: { value: 1 }, nightK: { value: 0 }, seed: { value: 0 },
    },
  });
  const pass = (fs, uniforms, defs = {}) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false, uniforms, defines: defs });
  const mBright = fx && pass(FS_BRIGHT, { tColor: { value: rt.texture }, tDepth: { value: dt }, texel: { value: new THREE.Vector2() } });
  const mBlur = fx && pass(FS_BLUR, { tSrc: { value: null }, dir: { value: new THREE.Vector2() } });
  const mRays = fx && pass(FS_RAYS, { tSrc: { value: T.a.texture }, sunUV: { value: sunUV }, aspect: { value: 1 } });
  const mAO = ao && pass(FS_AO, { tDepth: { value: dt }, tColor: { value: rt.texture }, texel: { value: new THREE.Vector2() }, cNear: { value: 0.1 }, cFar: { value: 1 }, proj: { value: 1 } }, { SAMPLES: ao });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
  const qScene = new THREE.Scene(); qScene.add(quad);
  const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const sz = new THREE.Vector2(), v = new THREE.Vector3();
  const strength = opts.strength ?? 0.9;
  const draw = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(qScene, qCam); };
  const blur = (from, tmp) => { // séparable : H puis V, retour dans « from »
    mBlur.uniforms.tSrc.value = from.texture; mBlur.uniforms.dir.value.set(1 / from.width, 0); draw(mBlur, tmp);
    mBlur.uniforms.tSrc.value = tmp.texture; mBlur.uniforms.dir.value.set(0, 1 / from.height); draw(mBlur, from);
  };
  const O = {
    enabled: opts.enabled ?? true, width: opts.width ?? 1, fx, sunDir: null, under: false, hazeMax: 0.56,
    uniforms: mat.uniforms,
    // without canvas MSAA the scene keeps going through the anti-aliased target, lines just switch off
    get linear() { return O.enabled || fx || opts.canvasAA === false; },
    render(scene, camera) {
      if (!O.linear) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
      renderer.getDrawingBufferSize(sz);
      if (rt.width !== sz.x || rt.height !== sz.y) {
        rt.setSize(sz.x, sz.y);
        if (fx) {
          const w = Math.max(2, sz.x >> 2), h = Math.max(2, sz.y >> 2);
          T.a.setSize(w, h); T.b.setSize(w, h); T.r.setSize(w, h); T.c.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1)); T.d.setSize(T.c.width, T.c.height);
          if (aoRT) aoRT.setSize(Math.max(2, sz.x >> 1), Math.max(2, sz.y >> 1));
        }
      }
      const U = mat.uniforms;
      U.texel.value.set(1 / sz.x, 1 / sz.y);
      U.cNear.value = camera.near; U.cFar.value = camera.far;
      // keep lines about the same on-screen thickness on high-DPI screens
      U.thick.value = Math.max(0.5, O.width * renderer.getPixelRatio());
      U.strength.value = O.enabled ? strength : 0;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      if (fx) {
        const asp = sz.x / sz.y; U.aspect.value = asp; mRays.uniforms.aspect.value = asp;
        // position du soleil à l'écran
        sunUV.z = 0;
        if (O.sunDir) {
          v.copy(O.sunDir).multiplyScalar(500).add(camera.position).applyMatrix4(camera.matrixWorldInverse);
          if (v.z < 0) { v.applyMatrix4(camera.projectionMatrix); sunUV.x = v.x * 0.5 + 0.5; sunUV.y = v.y * 0.5 + 0.5; const q = Math.max(Math.abs(v.x), Math.abs(v.y)); sunUV.z = Math.max(0, Math.min(1, (2.2 - q) / 1.2)) * Math.max(0, Math.min(1, (O.sunDir.y + 0.02) / 0.1)); }
        }
        U.hazeK.value = O.under ? 0 : O.hazeMax;
        if (aoRT) { const a = mAO.uniforms; a.texel.value.copy(U.texel.value); a.cNear.value = camera.near; a.cFar.value = camera.far; a.proj.value = camera.projectionMatrix.elements[5] * sz.y * 0.5; U.aoTexel.value.set(1 / aoRT.width, 1 / aoRT.height); draw(mAO, aoRT); }
        mBright.uniforms.texel.value.copy(U.texel.value); draw(mBright, T.a);
        if (sunUV.z > 0.01 && !O.under) draw(mRays, T.r); else { renderer.setRenderTarget(T.r); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false); }
        blur(T.a, T.b);
        mBlur.uniforms.tSrc.value = T.a.texture; mBlur.uniforms.dir.value.set(0.5 / T.c.width, 0.5 / T.c.height); draw(mBlur, T.c); blur(T.c, T.d);
        quad.material = mat;
      }
      renderer.setRenderTarget(null); renderer.render(qScene, qCam);
    },
    // compile materials for the target the scene is really drawn into (tone mapping / colour space differ from the canvas)
    compile(scene, camera) {
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(O.linear ? rt : null); renderer.compile(scene, camera); renderer.setRenderTarget(prev);
    },
    dispose() { rt.dispose(); dt.dispose(); mat.dispose(); quad.geometry.dispose(); if (T) for (const k in T) T[k].dispose(); if (aoRT) aoRT.dispose(); },
  };
  return O;
}
