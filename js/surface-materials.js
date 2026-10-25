// Original, deterministic, seamless detail textures. No network assets or world RNG.
export const SURFACE = Object.freeze({ PLAIN: 0, WOOD: 1, BRICK: 2, STONE: 3, PLASTER: 4, ROOF: 5, METAL: 6, CONCRETE: 7 });

// Shared instanced nature materials. The generators never consume the map RNG.
export function createNatureLibrary(THREE) {
  const library = { version: 2 };
  for (const [kind, seed, base] of [['bark', 7731, 166], ['foliage', 7732, 159], ['rock', 7733, 189]]) {
    const s = 512, c = canvas(s), g = c.getContext('2d'), r = random(seed);
    grain(g, s, seed, base, kind === 'rock' ? 28 : 18);
    // Draw a toroidal tile: strokes crossing an edge continue at the opposite edge.
    const wrap = (draw, context = g) => {
      for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
        context.save(); context.translate(dx, dy); draw(); context.restore();
      }
    };
    if (kind === 'bark') {
      for (let i = 0; i < 70; i++) {
        const x = r() * s, y = r() * s, len = 50 + r() * 250, w = 1 + r() * 5;
        wrap(() => {
          g.beginPath(); g.moveTo(x, y);
          g.bezierCurveTo(x - 9, y + len * .3, x + 8, y + len * .7, x + 2, y + len);
          g.strokeStyle = gray(65 + (i % 7) * 10); g.lineWidth = w; g.stroke();
          g.translate(w + 1, 0); g.strokeStyle = 'rgba(255,255,255,.27)'; g.lineWidth = 1; g.stroke();
        });
      }
      for (let i = 0; i < 8; i++) {
        const x = r() * s, y = r() * s, w = 5 + r() * 5, h = 14 + r() * 13;
        wrap(() => {
          for (let ring = 1; ring <= 4; ring++) {
            g.beginPath(); g.ellipse(x, y, w * ring / 2, h * ring / 2, .12, 0, Math.PI * 2);
            g.strokeStyle = gray(75 + ring * 17); g.lineWidth = 1.4; g.stroke();
          }
        });
      }
    } else if (kind === 'foliage') {
      // Layered sprigs instead of a flat fill. Original instance colours tint these needles.
      for (let i = 0; i < 650; i++) {
        const x = r() * s, y = r() * s, angle = r() * Math.PI * 2;
        const size = 15 + r() * 31, shade = 55 + r() * 190;
        wrap(() => {
          g.translate(x, y); g.rotate(angle);
          g.strokeStyle = gray(shade * .8); g.lineWidth = 1;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -size); g.stroke();
          for (let j = 0; j < 5; j++) {
            const h = size * j / 5, spread = size * .36 * (1 - j / 6);
            g.strokeStyle = gray(shade + j * 2); g.lineWidth = 1.8;
            g.beginPath(); g.moveTo(-spread, -h - size * .25); g.lineTo(0, -h);
            g.lineTo(spread, -h - size * .25); g.stroke();
          }
        });
      }
    } else {
      // Angular mineral inclusions, hairline fractures and small aggregate.
      for (let i = 0; i < 150; i++) {
        const x = r() * s, y = r() * s, w = 3 + r() * 27, h = 2 + r() * 17;
        const shade = 115 + r() * 120;
        wrap(() => {
          g.fillStyle = gray(shade); g.globalAlpha = .55;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h * .2);
          g.lineTo(x + w * .65, y + h); g.lineTo(x - w * .2, y + h * .7); g.fill();
        });
      }
      for (let i = 0; i < 40; i++) {
        const points = [[r() * s, r() * s]], count = 3 + (r() * 5 | 0);
        for (let j = 0; j < count; j++) {
          const p = points[points.length - 1]; points.push([p[0] + 4 + r() * 20, p[1] - 12 + r() * 27]);
        }
        wrap(() => {
          g.beginPath(); points.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y));
          g.strokeStyle = gray(70 + i % 5 * 10); g.lineWidth = 1.1 + i % 3 * .4; g.stroke();
          g.translate(0, 1.4); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = .7; g.stroke();
        });
      }
      for (let i = 0; i < 4500; i++) {
        g.fillStyle = gray(110 + r() * 140); g.fillRect(r() * s, r() * s, .7 + r() * 1.6, .7 + r() * 1.6);
      }
      // Broad, angular fracture networks over the fine grain. Pack depth in alpha,
      // preserving RGB with alpha >= 128 (canvas premultiplication would erase RGB at 0).
      const mask = canvas(s), m = mask.getContext('2d');
      m.fillStyle = '#000'; m.fillRect(0, 0, s, s);
      const fracture = (start, angle, length, width) => {
        const points = [start], count = 5;
        for (let j = 1; j <= count; j++) {
          const bend = angle + (r() - .5) * 1.1, p = points[points.length - 1];
          points.push([p[0] + Math.cos(bend) * length / count, p[1] + Math.sin(bend) * length / count]);
        }
        const path = ctx => {
          ctx.beginPath(); points.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
          ctx.lineJoin = 'bevel'; ctx.lineCap = 'round';
        };
        wrap(() => {
          path(g); g.strokeStyle = gray(121); g.lineWidth = width + 4; g.stroke();
          g.strokeStyle = gray(48); g.lineWidth = width; g.stroke();
          g.translate(-1.2, -1.6); g.strokeStyle = 'rgba(255,255,255,.48)'; g.lineWidth = 1.1; g.stroke();
        });
        wrap(() => { path(m); m.strokeStyle = '#fff'; m.lineWidth = width; m.stroke(); }, m);
        return points;
      };
      for (let i = 0; i < 7; i++) {
        const angle = r() * Math.PI * 2;
        const points = fracture([r() * s, r() * s], angle, 170 + r() * 170, 3.5 + r() * 3);
        fracture(points[2], angle + .85, 65 + r() * 80, 1.8 + r() * 1.2);
        fracture(points[4], angle - .95, 50 + r() * 75, 1.6 + r());
      }
      const pixels = g.getImageData(0, 0, s, s), depth = m.getImageData(0, 0, s, s).data;
      for (let i = 0; i < depth.length; i += 4) pixels.data[i + 3] = 128 + Math.round(depth[i] * 127 / 255);
      g.putImageData(pixels, 0, 0);
    }
    const texture = new THREE.CanvasTexture(c);
    texture.name = `StormDrop ${kind} detail`;
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    if (kind === 'rock') texture.userData.fractureChains = 61;
    library[kind] = texture;
  }
  return library;
}

export function installNatureSurface(material, library, kind) {
  if (!['bark', 'foliage', 'rock'].includes(kind)) throw new Error(`Unknown nature surface: ${kind}`);
  material.userData.natureSurface = kind;
  material.customProgramCacheKey = () => `stormdrop-nature-v2-${kind}`;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.natureDetail = { value: library[kind] };
    const varyings = 'varying vec3 vNatureP; varying vec3 vNatureWorld; varying vec2 vNatureUV; varying vec2 vNaturePhase;';
    shader.vertexShader = `${varyings}\n${shader.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>
      // Instance transforms matter: tree height/radius and rotated rock scales are non-uniform.
      #ifdef USE_INSTANCING
        vec3 natureScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
        vNatureP=transformed*natureScale;
        vNatureWorld=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz;
        vNatureUV=uv*vec2(natureScale.x,natureScale.y);
        vNaturePhase=fract(instanceMatrix[3].xz*vec2(.137,.173))*13.0;
      #else
        vNatureP=transformed;
        vNatureWorld=(modelMatrix*vec4(transformed,1.0)).xyz;
        vNatureUV=uv; vNaturePhase=vec2(0.0);
      #endif
    `);
    shader.fragmentShader = `uniform sampler2D natureDetail;\n${varyings}\n${shader.fragmentShader}`
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 natureFace=normalize(cross(dFdx(vNatureP),dFdy(vNatureP)));
        vec3 natureWeights=pow(abs(natureFace),vec3(5.0));
        natureWeights/=max(dot(natureWeights,vec3(1.0)),.0001);
        ${kind === 'bark' ? `
          float natureRelief=texture2D(natureDetail,vNatureUV*vec2(1.6,.62)+vNaturePhase).r;
        ` : `
          vec3 natureCoord=vNatureP*${kind === 'rock' ? '.44' : '.48'};
          vec4 natureSample=texture2D(natureDetail,natureCoord.yz+vNaturePhase)*natureWeights.x
            +texture2D(natureDetail,natureCoord.xz+vNaturePhase)*natureWeights.y
            +texture2D(natureDetail,natureCoord.xy+vNaturePhase)*natureWeights.z;
          float natureRelief=natureSample.r;
        `}
        float natureNear=1.0-smoothstep(30.0,95.0,length(vViewPosition));
        diffuseColor.rgb*=mix(1.0,${kind === 'foliage' ? '.36+.85' : kind === 'bark' ? '.30+1.10' : '.40+.83'}*natureRelief,natureNear);
        ${kind === 'rock' ? `
          float natureCrack=smoothstep(.05,.55,(natureSample.a-.502)*2.0);
          diffuseColor.rgb*=1.0-.48*natureCrack*natureNear;
          vec3 natureUp=normalize(cross(dFdx(vNatureWorld),dFdy(vNatureWorld)));
          float natureMoss=smoothstep(.25,.8,natureUp.y)*smoothstep(.64,.83,natureRelief);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.78,1.06,.63),natureMoss*.45*natureNear);
        ` : ''}
      `)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 nq0=dFdx(-vViewPosition),nq1=dFdy(-vViewPosition);
        vec3 nr1=cross(nq1,normal),nr2=cross(normal,nq0); float ndet=dot(nq0,nr1);
        normal=normalize(abs(ndet)*normal-sign(ndet)*${kind === 'foliage' ? '.012' : '.028'}*natureNear
          *(dFdx(natureRelief)*nr1+dFdy(natureRelief)*nr2));
      `);
  };
  return material;
}
export function surfaceForStyle(style) {
  return ({ brick: 2, city: 4, adobe: 4, agency: 3, bunker: 7, wood: 1, beach: 1, chalet: 1 })[style] ?? 4;
}
function random(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function canvas(size, height = size) {
  const c = document.createElement('canvas'); c.width = size; c.height = height;
  return c;
}
const gray = (n) => `rgb(${n | 0},${n | 0},${n | 0})`;
function grain(g, s, seed, base, amount) {
  const r = random(seed), im = g.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const wave = Math.sin(x / s * Math.PI * 4 + Math.cos(y / s * Math.PI * 2)) * 3;
    const n = Math.max(0, Math.min(255, base + (r() - 0.5) * amount + wave)), i = (y * s + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
}
function masonry(g, s, r, stone) {
  const rows = stone ? 4 : 8, cols = stone ? 2 : 4, w = s / cols, h = s / rows;
  g.fillStyle = gray(stone ? 155 : 137); g.fillRect(0, 0, s, s);
  for (let y = 0; y < rows; y++) for (let x = -1; x <= cols; x++) {
    const left = x * w + (y % 2) * w / 2, top = y * h, gap = stone ? 1.8 : 1.7;
    g.fillStyle = gray((stone ? 208 : 201) + r() * (stone ? 40 : 37));
    g.fillRect(left + gap, top + gap, w - gap * 2, h - gap * 2);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(left + gap, top + gap, w - gap * 2, 1);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(left + gap, top + h - gap - 1, w - gap * 2, 1.2);
    for (let k = 0; k < 65; k++) {
      g.fillStyle = `rgba(25,25,25,${r() * (stone ? 0.075 : 0.1)})`;
      g.fillRect(left + gap + r() * (w - gap * 2), top + gap + r() * (h - gap * 2), 1 + r() * 2, 1);
    }
  }
}
function tile(kind) {
  const s = 256, c = canvas(s), g = c.getContext('2d'), r = random(4310 + kind);
  grain(g, s, 127 + kind, 218, kind === SURFACE.PLASTER ? 20 : 10);
  if (kind === SURFACE.WOOD) {
    for (let j = 0; j < 6; j++) {
      const y = j * s / 6, h = s / 6;
      g.fillStyle = gray(218 + r() * 25); g.fillRect(0, y + 2, s, h - 3);
      g.fillStyle = 'rgba(20,20,20,.38)'; g.fillRect(0, y, s, 1.7);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, y + 2, s, 1);
      for (let k = 0; k < 45; k++) {
        const yy = y + 5 + r() * (h - 8);
        g.strokeStyle = `rgba(40,40,40,${0.025 + r() * 0.07})`; g.lineWidth = 0.5;
        g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(80, yy + r() * 3, 170, yy - r() * 3, s, yy); g.stroke();
      }
      const joint = (j % 3) * 78 + 12;
      g.fillStyle = 'rgba(40,40,40,.2)'; g.fillRect(joint, y + 2, 1, h - 3);
    }
  } else if (kind === SURFACE.BRICK || kind === SURFACE.STONE) masonry(g, s, r, kind === SURFACE.STONE);
  else if (kind === SURFACE.ROOF) {
    for (let row = 0; row < 8; row++) for (let col = -1; col < 5; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 32;
      g.fillStyle = gray(175 + r() * 65); g.fillRect(x + 1, y + 1, 62, 30);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + 2, y + 1, 60, 1);
      g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x, y + 29, 64, 3);
      for (let k = 0; k < 8; k++) {
        g.fillStyle = 'rgba(30,30,30,.08)'; g.fillRect(x + r() * 60, y + 3, 0.6, 24);
      }
    }
  } else if (kind === SURFACE.METAL) {
    for (let x = 0; x < s; x += 64) {
      g.fillStyle = 'rgba(15,15,15,.35)'; g.fillRect(x, 0, 2, s);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 2, 0, 1, s);
      for (const y of [9, s - 9]) {
        g.fillStyle = gray(130); g.beginPath(); g.arc(x + 9, y, 2, 0, Math.PI * 2); g.fill();
        g.fillStyle = gray(245); g.fillRect(x + 8, y - 1, 1.5, 1);
      }
    }
  } else if (kind === SURFACE.CONCRETE) {
    g.fillStyle = 'rgba(45,45,45,.18)'; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s);
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = `rgba(40,40,40,${r() * 0.15})`;
      g.fillRect(r() * s, r() * s, 1 + r() * 1.5, 1);
    }
  }
  return c;
}
export function createSurfaceLibrary(THREE) {
  const atlas = canvas(1024, 512), g = atlas.getContext('2d'), tiles = {};
  for (let k = 1; k <= 8; k++) {
    const t = tile(k); tiles[k] = t;
    g.drawImage(t, (k - 1) % 4 * 256, Math.floor((k - 1) / 4) * 256);
  }
  const grass = canvas(512), gg = grass.getContext('2d'), r = random(78012);
  grain(gg, 512, 9328, 191, 22);
  // Each blade crossing an edge is copied to the opposite edge for seamless repeat.
  for (let i = 0; i < 11000; i++) {
    const x = r() * 512, y = r() * 512, dx = (r() - 0.5) * 5, dy = 3 + r() * 10;
    const v = 95 + r() * 155;
    gg.strokeStyle = gray(v); gg.lineWidth = 0.65 + r() * 1.1;
    for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
      if (x + ox < -12 || x + ox > 524 || y + oy < -12 || y + oy > 524) continue;
      gg.beginPath(); gg.moveTo(x + ox, y + oy);
      gg.quadraticCurveTo(x + ox + dx, y + oy - dy * 0.6, x + ox + dx * 1.4, y + oy - dy); gg.stroke();
    }
  }
  const texture = (c, repeat) => {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
    t.wrapS = t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.anisotropy = 4; return t;
  };
  const atlasTexture = texture(atlas, false);
  // Atlas rows use canvas top-to-bottom coordinates, unlike ordinary UV images.
  atlasTexture.flipY = false;
  return { version: 1, atlas: atlasTexture, grass: texture(grass, true), tiles };
}
const WORLD_VERTEX = `
varying vec3 vSurfaceWorld;
`;
const NOISE = `
float surfaceHash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float surfaceNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(surfaceHash(i),surfaceHash(i+vec2(1,0)),f.x),
             mix(surfaceHash(i+vec2(0,1)),surfaceHash(i+vec2(1,1)),f.x),f.y);
}
`;
function worldVertex(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n' + WORLD_VERTEX)
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSurfaceWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
}
export function installTerrainSurface(material, library, time) {
  material.customProgramCacheKey = () => 'stormdrop-grass-v1';
  material.userData.surfaceVersion = library.version;
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uGrassDetail = { value: library.grass }; sh.uniforms.uSurfaceTime = time;
    worldVertex(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        ${WORLD_VERTEX} ${NOISE}
        uniform sampler2D uGrassDetail; uniform float uSurfaceTime;
        float terrainHeightDetail=0.0; float terrainGrassMask=0.0;
      `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 terrainN=normalize(cross(dFdx(vSurfaceWorld),dFdy(vSurfaceWorld)));
        terrainGrassMask=smoothstep(0.012,0.09,diffuseColor.g-max(diffuseColor.r,diffuseColor.b))
          *smoothstep(0.55,0.9,abs(terrainN.y))*smoothstep(1.5,2.8,vSurfaceWorld.y);
        float detailFade=1.0-smoothstep(18.0,65.0,distance(cameraPosition,vSurfaceWorld));
        float blade=texture2D(uGrassDetail,vSurfaceWorld.xz/4.8).r;
        float undergrowth=surfaceNoise(vSurfaceWorld.xz*0.24);
        float meadow=surfaceNoise(vSurfaceWorld.xz*0.036+12.0);
        diffuseColor.rgb*=mix(0.96,1.04,undergrowth);
        diffuseColor.rgb*=1.0+terrainGrassMask*((blade-0.74)*0.68*detailFade+(undergrowth-0.5)*0.16);
        float dry=smoothstep(0.56,0.82,meadow)*terrainGrassMask;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,1.0,0.78),dry*0.38);
        terrainHeightDetail=blade*detailFade*terrainGrassMask;
        float shore=-0.08+0.12*sin(uSurfaceTime*1.3+vSurfaceWorld.x*0.07+vSurfaceWorld.z*0.05);
        float foam=(1.0-smoothstep(0.04,0.32,abs(vSurfaceWorld.y-shore)))
          *(0.75+0.25*surfaceNoise(vSurfaceWorld.xz*1.3+uSurfaceTime*0.6));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.97,0.99,1.0),foam*0.8);
      `)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 tq0=dFdx(-vViewPosition),tq1=dFdy(-vViewPosition);
        vec3 tr1=cross(tq1,normal),tr2=cross(normal,tq0);
        float tdet=dot(tq0,tr1);
        normal=normalize(abs(tdet)*normal-sign(tdet)*0.022*(dFdx(terrainHeightDetail)*tr1+dFdy(terrainHeightDetail)*tr2));
      `);
  };
}
export function installBuildingSurface(material, library) {
  material.customProgramCacheKey = () => 'stormdrop-buildings-v1';
  material.userData.surfaceVersion = library.version;
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uFacadeAtlas = { value: library.atlas };
    worldVertex(sh);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float surfaceKind; varying float vSurfaceKind;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfaceKind=surfaceKind;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        ${WORLD_VERTEX} ${NOISE}
        varying float vSurfaceKind; uniform sampler2D uFacadeAtlas;
        float facadeRelief=0.0;
      `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        if(vSurfaceKind>0.5) {
          vec3 n=abs(normalize(cross(dFdx(vSurfaceWorld),dFdy(vSurfaceWorld))));
          vec2 uv=n.y>0.7?vSurfaceWorld.xz:(n.x>n.z?vSurfaceWorld.zy:vSurfaceWorld.xy);
          float kind=floor(vSurfaceKind+0.5);
          if(kind==5.0 && n.y<0.2) kind=4.0;
          vec2 metres=vec2(3.2);
          if(kind==1.0)metres=vec2(3.6,2.4);
          if(kind==2.0)metres=vec2(2.88,2.24);
          if(kind==3.0)metres=vec2(2.8);
          if(kind==5.0)metres=vec2(2.0);
          if(kind==6.0)metres=vec2(2.0,3.0);
          vec2 cell=vec2(mod(kind-1.0,4.0),floor((kind-1.0)/4.0));
          vec2 tiled=fract(uv/metres);
          // Explicit gradients prevent mip seams where a repeated tile wraps.
          vec2 atlasUV=(cell+(tiled*252.0+2.0)/256.0)/vec2(4,2);
          float detail=textureGrad(uFacadeAtlas,atlasUV,dFdx(uv/metres)/vec2(4,2),dFdy(uv/metres)/vec2(4,2)).r;
          float weather=surfaceNoise(uv*0.8);
          diffuseColor.rgb*=0.64+detail*0.42+(weather-0.5)*0.025;
          facadeRelief=detail*(1.0-smoothstep(18.0,45.0,distance(cameraPosition,vSurfaceWorld)));
        }
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        if(vSurfaceKind>0.5) roughnessFactor=vSurfaceKind==6.0?0.58:0.91;
      `)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 fq0=dFdx(-vViewPosition),fq1=dFdy(-vViewPosition);
        vec3 fr1=cross(fq1,normal),fr2=cross(normal,fq0); float fdet=dot(fq0,fr1);
        normal=normalize(abs(fdet)*normal-sign(fdet)*0.018*(dFdx(facadeRelief)*fr1+dFdy(facadeRelief)*fr2));
      `);
  };
}
