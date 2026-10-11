// Cartoon outlines (post-process). The scene is rendered once into a render target;
// a full-screen pass reads colour + depth and draws dark lines on silhouettes and creases.
// Uses the second derivative of 1/z: it is zero on flat surfaces, so only real edges get lines.
import * as THREE from 'three';

const VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FS = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform vec2 texel; uniform float cNear; uniform float cFar; uniform float thick;
uniform vec3 lineColor; uniform float strength; uniform float fadeNear; uniform float fadeFar; uniform float useAlpha;
varying vec2 vUv;
float viewZ(float d) { float z = d * 2.0 - 1.0; return 2.0 * cNear * cFar / (cFar + cNear - z * (cFar - cNear)); }
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
  float e = max(smoothstep(0.03, 0.12, lap), smoothstep(0.06, 0.25, sil));
  e *= 1.0 - smoothstep(fadeNear, fadeFar, z0);
  e *= step(z0, cFar * 0.98);
  e *= strength;
  // light grade: a touch more saturation for the sunny cartoon look
  vec3 g = mix(vec3(dot(c.rgb, vec3(0.2126, 0.7152, 0.0722))), c.rgb, 1.05);
  vec3 col = mix(max(g, 0.0), lineColor, e);
  float a = useAlpha > 0.5 ? max(c.a, e) : 1.0;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createOutline(renderer, opts = {}) {
  const gl2 = renderer.capabilities.isWebGL2;
  const dt = new THREE.DepthTexture(1, 1); dt.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: gl2 ? (opts.samples ?? 4) : 0, depthTexture: dt, depthBuffer: true });
  const mat = new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false,
    transparent: !!opts.alpha, premultipliedAlpha: !!opts.alpha,
    uniforms: {
      tColor: { value: rt.texture }, tDepth: { value: dt }, texel: { value: new THREE.Vector2() },
      cNear: { value: 0.1 }, cFar: { value: 1000 }, thick: { value: 1 },
      lineColor: { value: new THREE.Color(opts.color ?? 0x0d0a24) }, strength: { value: opts.strength ?? 0.9 },
      fadeNear: { value: opts.fadeNear ?? 60 }, fadeFar: { value: opts.fadeFar ?? 220 }, useAlpha: { value: opts.alpha ? 1 : 0 },
    },
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
  const qScene = new THREE.Scene(); qScene.add(quad);
  const qCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const sz = new THREE.Vector2();
  const strength = opts.strength ?? 0.9;
  const O = {
    enabled: opts.enabled ?? true, width: opts.width ?? 1,
    uniforms: mat.uniforms,
    // without canvas MSAA the scene keeps going through the anti-aliased target, lines just switch off
    get linear() { return O.enabled || opts.canvasAA === false; },
    render(scene, camera) {
      if (!O.linear) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
      renderer.getDrawingBufferSize(sz);
      if (rt.width !== sz.x || rt.height !== sz.y) rt.setSize(sz.x, sz.y);
      const U = mat.uniforms;
      U.texel.value.set(1 / sz.x, 1 / sz.y);
      U.cNear.value = camera.near; U.cFar.value = camera.far;
      // keep lines about the same on-screen thickness on high-DPI screens
      U.thick.value = Math.max(0.5, O.width * renderer.getPixelRatio());
      U.strength.value = O.enabled ? strength : 0;
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(qScene, qCam);
    },
    // compile materials for the target the scene is really drawn into (tone mapping / colour space differ from the canvas)
    compile(scene, camera) {
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(O.linear ? rt : null); renderer.compile(scene, camera); renderer.setRenderTarget(prev);
    },
    dispose() { rt.dispose(); dt.dispose(); mat.dispose(); quad.geometry.dispose(); },
  };
  return O;
}
