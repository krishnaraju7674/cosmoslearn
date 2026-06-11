import React, { useRef, useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useTexture, Line as DreiLine, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useAppStore } from '@/stores/useAppStore';
import { planets } from '@/utils/planetData';
import * as THREE from 'three';
import { audioEngine } from '@/services/audioEngine';

// ─── Constants ──────────────────────────────────────────────────
const TEXTURE_URLS: Record<string, string> = {
  sun: 'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
  mercury: 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
  venus: 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
  earth: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
  mars: 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
  jupiter: 'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
  saturn: 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
  uranus: 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
  neptune: 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
  pluto: 'https://www.solarsystemscope.com/textures/download/2k_pluto.jpg',
  ceres: 'https://www.solarsystemscope.com/textures/download/2k_ceres.jpg',
  eris: 'https://www.solarsystemscope.com/textures/download/2k_eris.jpg',
  makemake: 'https://www.solarsystemscope.com/textures/download/2k_makemake.jpg',
  haumea: 'https://www.solarsystemscope.com/textures/download/2k_haumea.jpg',
};
const EARTH_CLOUDS_URL = 'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg';
const EARTH_NORMAL_URL = 'https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.jpg';
const EARTH_NIGHT_URL = 'https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg';
const SATURN_RING_URL = 'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png';
const MOON_URL = 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg';

const isInner = (id: string) => ['mercury', 'venus', 'earth', 'mars'].includes(id);
const isGasGiant = (id: string) => ['jupiter', 'saturn'].includes(id);

// ─── Canvas Texture Helpers ─────────────────────────────────────
function createRadialGradientTexture(stops: { pos: number; color: string }[], size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(s => grd.addColorStop(s.pos, s.color));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Sun Procedural Texture (fallback) ──────────────────────────
function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
  grd.addColorStop(0, '#fffbe6'); grd.addColorStop(0.15, '#ffdd44');
  grd.addColorStop(0.35, '#ff8800'); grd.addColorStop(0.55, '#ff4400');
  grd.addColorStop(0.75, '#cc2200'); grd.addColorStop(1, '#330000');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 1024, y = Math.random() * 1024, r = 5 + Math.random() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,220,100,${Math.random() * 0.15})`);
    g.addColorStop(1, `rgba(255,220,100,0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true; return tex;
}

// ─── Sun Corona Shader ──────────────────────────────────────────
const sunVertShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const sunFragShader = `uniform float uTime;varying vec2 vUv;void main(){vec2 c=vUv-0.5;float d=length(c);float a=smoothstep(0.55,0.0,d);float w1=sin(uTime*0.8+d*30.0)*0.5+0.5;float w2=cos(uTime*1.2+d*50.0+c.x*10.0)*0.3+0.7;float p=w1*0.6+w2*0.4;vec3 col=mix(vec3(1.0,0.5,0.0),vec3(1.0,0.2,0.0),p*0.5);a*=p*0.25;gl_FragColor=vec4(col,a);}`;

// ─── Sun ────────────────────────────────────────────────────────
function Sun() {
  const sunRef = useRef<THREE.Mesh>(null!);
  const coronaRef = useRef<THREE.Mesh>(null!);
  const sprite20Ref = useRef<THREE.Sprite>(null!);
  const sprite32Ref = useRef<THREE.Sprite>(null!);
  const pulseRef = useRef<THREE.Sprite>(null!);
  const { settings } = useAppStore();
  const timeSpeed = settings.timeSpeed;

  const coronaTex = useMemo(() => createRadialGradientTexture([
    { pos: 0, color: 'rgba(255,106,0,1)' },
    { pos: 0.3, color: 'rgba(255,34,0,0.6)' },
    { pos: 0.7, color: 'rgba(255,0,0,0)' },
  ]), []);
  const outerTex = useMemo(() => createRadialGradientTexture([
    { pos: 0, color: 'rgba(255,68,0,0.5)' },
    { pos: 0.5, color: 'rgba(255,68,0,0)' },
  ]), []);
  const fallbackTex = useMemo(() => createSunTexture(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sunRef.current) sunRef.current.rotation.y += 0.001 * timeSpeed;
    if (coronaRef.current) {
      const mat = coronaRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = t;
      coronaRef.current.rotation.x = Math.sin(t * 0.08) * 0.15;
      coronaRef.current.rotation.z = Math.cos(t * 0.08 * 0.6) * 0.12;
    }
    if (sprite20Ref.current) {
      const s = 20 + Math.sin(t * 0.5) * 1.5;
      sprite20Ref.current.scale.setScalar(s);
    }
    if (sprite32Ref.current) {
      const s = 32 + Math.sin(t * 0.3 + 1) * 2;
      sprite32Ref.current.scale.setScalar(s);
    }
    if (pulseRef.current) {
      const s = 8 + Math.sin(t * 2) * 0.16;
      pulseRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[8, 64, 64]} />
        <meshBasicMaterial map={fallbackTex} />
      </mesh>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[9, 32, 32]} />
        <shaderMaterial transparent depthWrite={false} uniforms={{ uTime: { value: 0 } }}
          vertexShader={sunVertShader} fragmentShader={sunFragShader} />
      </mesh>
      <sprite ref={sprite20Ref} scale={[20, 20, 1]}>
        <spriteMaterial map={coronaTex} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite ref={sprite32Ref} scale={[32, 32, 1]}>
        <spriteMaterial map={outerTex} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite ref={pulseRef} scale={[8, 8, 1]}>
        <spriteMaterial map={coronaTex} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <SunLensFlare />
    </group>
  );
}

// ─── Sun Lens Flare ─────────────────────────────────────────────
function SunLensFlare() {
  const flare1Ref = useRef<THREE.Sprite>(null!);
  const flare2Ref = useRef<THREE.Sprite>(null!);
  const flare3Ref = useRef<THREE.Sprite>(null!);
  const { camera } = useThree();
  const flareTex = useMemo(() => createRadialGradientTexture([
    { pos: 0, color: 'rgba(255,200,100,1)' },
    { pos: 0.4, color: 'rgba(255,100,20,0)' },
  ], 128), []);

  useFrame(() => {
    const dir = new THREE.Vector3(0, 0, 0);
    const camDir = camera.getWorldDirection(new THREE.Vector3());
    const dot = Math.max(0, -camDir.dot(dir.clone().sub(camera.position).normalize()));
    const opacity = Math.pow(dot, 4) * 0.6;
    if (flare1Ref.current) {
      flare1Ref.current.material.opacity = opacity;
      flare1Ref.current.position.set(Math.sin(0.5) * 14, Math.cos(0.5) * 8, 0);
    }
    if (flare2Ref.current) {
      flare2Ref.current.material.opacity = opacity * 0.5;
      flare2Ref.current.position.set(Math.sin(-0.5) * 14, Math.cos(-0.5) * 8, 0);
    }
    if (flare3Ref.current) {
      flare3Ref.current.material.opacity = opacity * 0.3;
      flare3Ref.current.position.set(Math.sin(0) * 18, Math.cos(0) * 10, 0);
    }
  });

  return (
    <group>
      <sprite ref={flare1Ref} scale={[3, 0.8, 1]}>
        <spriteMaterial map={flareTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite ref={flare2Ref} scale={[3, 0.8, 1]}>
        <spriteMaterial map={flareTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite ref={flare3Ref} scale={[5, 1.2, 1]}>
        <spriteMaterial map={flareTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

// ─── Procedural Texture Fallback ─────────────────────────────────
function createProceduralTexture(planet: typeof planets[0]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = planet.color; ctx.fillRect(0, 0, 512, 256);
  if (planet.type.includes('Gas') || planet.type.includes('Ice')) {
    for (let l = 0; l < 30; l++) {
      const y = Math.random() * 256, h = 3 + Math.random() * 10, b = Math.random() * 0.25;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${b})` : `rgba(0,0,0,${b * 0.6})`;
      ctx.fillRect(0, y, 512, h);
    }
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512, y = Math.random() * 256, w = 20 + Math.random() * 60;
      ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      ctx.lineWidth = 2 + Math.random() * 4;
      ctx.beginPath(); ctx.ellipse(x, y, w, 4 + Math.random() * 8, Math.random() * Math.PI, 0, Math.PI * 2); ctx.stroke();
    }
  }
  if (planet.type === 'Terrestrial planet') {
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 512, y = Math.random() * 256, r = 1 + Math.random() * 6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.25})`; ctx.fill();
      ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.1})`; ctx.fill();
    }
  }
  if (planet.id === 'earth') for (let i = 0; i < 100; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, r = 3 + Math.random() * 25, g = 80 + Math.random() * 120;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(30,${g},30,${0.1 + Math.random() * 0.25})`; ctx.fill();
  }
  if (planet.id === 'jupiter') {
    ctx.beginPath(); ctx.ellipse(250, 140, 30, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,80,40,0.4)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(260, 136, 15, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,100,50,0.3)'; ctx.fill();
  }
  if (planet.id === 'mars') { ctx.fillStyle = 'rgba(220,220,220,0.3)'; ctx.fillRect(0, 0, 512, 6); ctx.fillRect(0, 250, 512, 6); }
  if (planet.id === 'mercury') for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, r = 2 + Math.random() * 10;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(50,50,50,${0.1 + Math.random() * 0.25})`; ctx.fill();
  }
  if (planet.id === 'venus') for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, r = 4 + Math.random() * 15;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(160,130,60,${0.05 + Math.random() * 0.15})`; ctx.fill();
  }
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, r = 1 + Math.random() * 2, b = Math.random() * 0.08;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${b})` : `rgba(0,0,0,${b})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true; return tex;
}

// ─── Atmosphere Rim Glow Shader ──────────────────────────────────
const atmoVertShader = `varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vP=(modelViewMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const atmoFragShader = `uniform vec3 uC;uniform float uI;varying vec3 vN;varying vec3 vP;void main(){vec3 v=normalize(-vP);float r=1.0-max(0.0,dot(v,vN));r=pow(r,3.0);gl_FragColor=vec4(uC,r*uI);}`;

function AtmosphereRim({ radius, color, intensity = 1 }: { radius: number; color: string; intensity?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial transparent depthWrite={false} side={THREE.BackSide}
        uniforms={{ uC: { value: new THREE.Color(color) }, uI: { value: intensity } }}
        vertexShader={atmoVertShader} fragmentShader={atmoFragShader} />
    </mesh>
  );
}

// ─── Planet Texture Mesh (meshStandardMaterial) ─────────────────
function PlanetTextureMesh({ planet, hovered }: { planet: typeof planets[0]; hovered: boolean }) {
  const isGas = isGasGiant(planet.id);
  const isInnerP = isInner(planet.id);

  const loaded = useTexture({
    map: TEXTURE_URLS[planet.id],
    ...(planet.id === 'earth' ? { normalMap: EARTH_NORMAL_URL } : {}),
  }) as unknown as { map: THREE.Texture; normalMap?: THREE.Texture };

  return (
    <meshStandardMaterial
      map={loaded.map}
      normalMap={planet.id === 'earth' ? loaded.normalMap : undefined}
      normalScale={planet.id === 'earth' ? new THREE.Vector2(1.2, 1.2) : undefined}
      roughness={isGas ? 0.4 : 0.8}
      metalness={isGas ? 0 : 0.1}
      emissive={planet.emissive}
      emissiveIntensity={hovered ? 0.6 : 0.15}
    />
  );
}

// ─── Earth City Lights ──────────────────────────────────────────
function EarthCityLights({ planetRadius }: { planetRadius: number }) {
  const nightTex = useTexture(EARTH_NIGHT_URL);
  return (
    <mesh>
      <sphereGeometry args={[planetRadius * 1.005, 48, 48]} />
      <meshStandardMaterial map={nightTex} emissiveMap={nightTex} emissive={new THREE.Color('#ffdd88')}
        emissiveIntensity={0.4} transparent opacity={0.7} depthWrite={false} />
    </mesh>
  );
}

// ─── Earth Clouds ───────────────────────────────────────────────
function EarthClouds({ planetRadius }: { planetRadius: number }) {
  const cloudRef = useRef<THREE.Mesh>(null!);
  const tex = useTexture(EARTH_CLOUDS_URL);
  useFrame(() => { if (cloudRef.current) cloudRef.current.rotation.y -= 0.008; });
  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[planetRadius * 1.02, 48, 48]} />
      <meshStandardMaterial map={tex} transparent opacity={0.4} depthWrite={false} roughness={0.4} metalness={0} />
    </mesh>
  );
}

// ─── Earth Moon ─────────────────────────────────────────────────
function EarthMoon({ planetRadius, earthSpeed }: { planetRadius: number; earthSpeed: number }) {
  const moonRef = useRef<THREE.Mesh>(null!);
  const tex = useTexture(MOON_URL);
  const orbitR = planetRadius * 2.5;
  useFrame(({ clock }) => {
    if (!moonRef.current) return;
    const a = clock.getElapsedTime() * earthSpeed * 13.37;
    moonRef.current.position.x = Math.cos(a) * orbitR;
    moonRef.current.position.z = Math.sin(a) * orbitR;
  });
  return (
    <mesh ref={moonRef} castShadow receiveShadow>
      <sphereGeometry args={[0.27, 24, 24]} />
      <meshStandardMaterial map={tex} roughness={0.9} metalness={0} />
    </mesh>
  );
}

// ─── Saturn Rings ───────────────────────────────────────────────
function SaturnRings({ planetRadius }: { planetRadius: number }) {
  const tex = useTexture(SATURN_RING_URL);
  return (
    <group>
      <mesh rotation={[THREE.MathUtils.degToRad(26.7), 0, 0]}>
        <ringGeometry args={[planetRadius * 1.3, planetRadius * 2.4, 128]} />
        <meshStandardMaterial map={tex} transparent opacity={0.85} side={THREE.DoubleSide} roughness={0.6} metalness={0} depthWrite={false} />
      </mesh>
      <mesh rotation={[THREE.MathUtils.degToRad(26.7), 0, 0]} position={[0, -planetRadius * 0.05, 0]}>
        <ringGeometry args={[planetRadius * 1.3, planetRadius * 2.4, 64]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Planet Component ───────────────────────────────────────────
function Planet({ planet, index }: { planet: (typeof planets)[0]; index: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const selectRingRef = useRef<THREE.Mesh>(null!);
  const { selectPlanet, explorePlanet, setShowPanel, settings, selectedPlanet } = useAppStore();
  const isSelected = selectedPlanet?.id === planet.id;
  const timeSpeed = settings.timeSpeed;
  const [hovered, setHovered] = useState(false);
  const targetScale = useRef(1);
  const currentScale = useRef(1);
  const isOuter = planet.id === 'uranus' || planet.id === 'neptune';
  const segs = isOuter ? 24 : 48;
  const totalPlanets = useMemo(() => planets.filter(p => p.id !== 'sun').length, []);
  const angle = useMemo(() => (index * Math.PI * 2) / totalPlanets, [index, totalPlanets]);
  const fallbackTexture = useMemo(() => createProceduralTexture(planet), [planet.id]);
  const [texLoaded, setTexLoaded] = useState(false);
  const [texErr, setTexErr] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(TEXTURE_URLS[planet.id], () => setTexLoaded(true), undefined, () => setTexErr(true));
  }, [planet.id]);

  useFrame(({ clock }) => {
    if (!groupRef.current || !meshRef.current) return;
    const elapsed = clock.getElapsedTime() * timeSpeed;
    const orbitAngle = angle + elapsed * planet.orbitalSpeed * 0.1;
    groupRef.current.position.x = Math.cos(orbitAngle) * planet.orbitRadius;
    groupRef.current.position.z = Math.sin(orbitAngle) * planet.orbitRadius;
    meshRef.current.rotation.x = planet.axialTilt * (Math.PI / 180);
    meshRef.current.rotation.y += planet.rotationSpeed * timeSpeed;
    targetScale.current = isSelected ? 1.25 : hovered ? 1.15 : 1;
    currentScale.current += (targetScale.current - currentScale.current) * 0.06;
    groupRef.current.scale.setScalar(currentScale.current);
    if (selectRingRef.current) {
      const pulse = 0.6 + 0.4 * Math.sin(clock.getElapsedTime() * 2);
      const mat = selectRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isSelected ? pulse * 0.5 : 0;
      const s = 1 + 0.08 * Math.sin(clock.getElapsedTime() * 1.5);
      selectRingRef.current.scale.setScalar(s);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectPlanet(planet);
    explorePlanet(planet.id);
    setShowPanel(true);
    audioEngine.playPlanetSelect(index);
  };

  const planetRadius = planet.size * 0.4;

  return (
    <group ref={groupRef}>
      {settings.showOrbitTrails && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.orbitRadius - 0.08, planet.orbitRadius + 0.08, 64]} />
          <meshBasicMaterial color={planet.color} transparent opacity={hovered ? 0.25 : 0.06} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hovered && (
        <mesh>
          <ringGeometry args={[planetRadius * 1.4, planetRadius * 1.8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      <mesh ref={selectRingRef}>
        <ringGeometry args={[planetRadius * 1.3, planetRadius * 2.0, 48]} />
        <meshBasicMaterial color={planet.color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={meshRef} onClick={handleClick}
        onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
        {...(isInner(planet.id) ? { castShadow: true, receiveShadow: true } : {})}>
        <sphereGeometry args={[planetRadius, segs, segs]} />
        {texLoaded && !texErr ? (
          <PlanetTextureMesh planet={planet} hovered={hovered} />
        ) : (
          <meshStandardMaterial map={fallbackTexture} roughness={0.8} metalness={0.1}
            emissive={planet.emissive} emissiveIntensity={hovered ? 0.6 : 0.15} />
        )}
      </mesh>

      {planet.id === 'earth' && texLoaded && !texErr && (
        <><EarthCityLights planetRadius={planetRadius} /><EarthClouds planetRadius={planetRadius} /></>
      )}
      {planet.id === 'earth' && <AtmosphereRim radius={planetRadius * 1.05} color="#4fc3f7" intensity={0.8} />}

      {planet.hasAtmosphere && planet.id !== 'sun' && planet.id !== 'earth' && (
        <AtmosphereRim radius={planetRadius * 1.18} color={planet.color} intensity={0.6} />
      )}

      {hovered && (
        <mesh>
          <sphereGeometry args={[planetRadius * 1.25, 16, 16]} />
          <meshBasicMaterial color={planet.color} transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>
      )}

      {planet.hasRing && planet.id === 'saturn' && texLoaded && !texErr ? (
        <SaturnRings planetRadius={planetRadius} />
      ) : planet.hasRing && planet.id === 'haumea' ? (
        <mesh rotation={[0.4, 0.2, 0]}>
          <ringGeometry args={[planetRadius * 1.6, planetRadius * 2.8, 64]} />
          <meshStandardMaterial color="#889088" transparent opacity={0.25} side={THREE.DoubleSide} roughness={0.6} metalness={0} />
        </mesh>
      ) : planet.hasRing && (
        <mesh rotation={[0.7, 0, 0.4]}>
          <ringGeometry args={[planetRadius * 1.3, planetRadius * 2.6, 64]} />
          <meshStandardMaterial color="#c8b88a" transparent opacity={0.4} side={THREE.DoubleSide} roughness={0.6} metalness={0} />
        </mesh>
      )}

      {planet.id === 'earth' && texLoaded && !texErr && (
        <EarthMoon planetRadius={planetRadius} earthSpeed={planet.orbitalSpeed} />
      )}
      {planet.id === 'earth' && !texLoaded && <EarthMoonSimple orbitRadius={planetRadius * 2.5} />}
      {planet.id === 'mars' && (
        <><SmallMoon orbitRadius={planetRadius * 2} size={0.08} speed={1.8} color="#aa8866" />
          <SmallMoon orbitRadius={planetRadius * 3.2} size={0.06} speed={0.9} color="#887766" /></>
      )}
      {planet.id === 'eris' && (
        <SmallMoon orbitRadius={planetRadius * 3} size={0.06} speed={0.5} color="#888888" />
      )}
      {planet.id === 'makemake' && (
        <SmallMoon orbitRadius={planetRadius * 2.5} size={0.04} speed={0.4} color="#999988" />
      )}
      {planet.id === 'haumea' && (
        <><SmallMoon orbitRadius={planetRadius * 2.8} size={0.05} speed={0.6} color="#aaaaaa" />
          <SmallMoon orbitRadius={planetRadius * 4.2} size={0.04} speed={0.3} color="#888888" /></>
      )}

      {settings.showLabels && (
        <Html position={[0, planetRadius * (isSelected ? 2.2 : 1.8), 0]} center>
          <div className={`planet-label whitespace-nowrap pointer-events-none select-none transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}>
            <div className={`text-xs font-bold tracking-widest drop-shadow-lg ${isSelected ? 'text-cosmic-neon' : 'text-white/90'}`}>
              {planet.name}
              {isSelected && <span className="ml-1.5 text-[8px] text-cosmic-neon/60 animate-pulse">◉</span>}
            </div>
            <div className="text-[8px] text-white/40 tracking-wide">{planet.type}</div>
          </div>
        </Html>
      )}

      {settings.showOrbitTrails && <AxisLine tilt={planet.axialTilt} radius={planetRadius} />}

      <DistanceIndicator label={`${planet.distanceFromSun}`} />

      {hovered && <HoverTooltip planet={planet} />}

      <OrbitTrail planetRadius={planet.orbitRadius} color={planet.color} active={hovered} />
    </group>
  );
}

// ─── Orbit Line ──────────────────────────────────────────────────
function OrbitLine({ planet }: { planet: typeof planets[0]; index: number }) {
  const { selectedPlanet } = useAppStore();
  const isSelected = selectedPlanet?.id === planet.id;
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(a) * planet.orbitRadius, 0, Math.sin(a) * planet.orbitRadius]);
    }
    return pts;
  }, [planet.orbitRadius]);
  return (
    <DreiLine points={points} color={planet.color} lineWidth={0.5} dashed dashSize={0.5} gapSize={0.3}
      transparent opacity={isSelected ? 0.5 : 0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
  );
}

// ─── Trail Comet ────────────────────────────────────────────────
function TrailComet({ planet, index }: { planet: typeof planets[0]; index: number }) {
  const dotRef = useRef<THREE.Mesh>(null!);
  const totalPlanets = useMemo(() => planets.filter(p => p.id !== 'sun').length, []);
  const angle = useMemo(() => (index * Math.PI * 2) / totalPlanets, [index, totalPlanets]);
  useFrame(({ clock }) => {
    if (!dotRef.current) return;
    const elapsed = clock.getElapsedTime();
    const oa = angle + elapsed * planet.orbitalSpeed * 0.1 - 0.15;
    dotRef.current.position.x = Math.cos(oa) * planet.orbitRadius;
    dotRef.current.position.z = Math.sin(oa) * planet.orbitRadius;
    (dotRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, 0.2 + Math.sin(elapsed * 0.5 + index) * 0.15);
  });
  return (
    <mesh ref={dotRef}>
      <sphereGeometry args={[0.1, 6, 6]} />
      <meshBasicMaterial color={planet.color} transparent opacity={0.3} />
    </mesh>
  );
}

// ─── Orbit Trail (20 fading spheres) ────────────────────────────
function OrbitTrail({ planetRadius, color, active }: { planetRadius: number; color: string; active: boolean }) {
  const trailRef = useRef<THREE.Group>(null!);
  const positions = useRef<THREE.Vector3[]>([]);
  const count = 20;

  useFrame(() => {
    if (!trailRef.current) return;
    const pos = trailRef.current.position.clone();
    positions.current.unshift(pos);
    if (positions.current.length > count) positions.current.length = count;
    trailRef.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (i < positions.current.length) {
        child.position.copy(positions.current[i]);
        mat.opacity = active ? (1 - i / count) * 0.4 : 0;
      } else {
        mat.opacity = 0;
      }
    });
  });

  return (
    <group ref={trailRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function SmallMoon({ orbitRadius, size, speed, color }: { orbitRadius: number; size: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = clock.getElapsedTime() * speed;
    ref.current.position.x = Math.cos(a) * orbitRadius;
    ref.current.position.z = Math.sin(a) * orbitRadius;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshPhongMaterial color={color} />
    </mesh>
  );
}

function EarthMoonSimple({ orbitRadius }: { orbitRadius: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = clock.getElapsedTime() * 0.5;
    ref.current.position.x = Math.cos(a) * orbitRadius;
    ref.current.position.z = Math.sin(a) * orbitRadius;
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <sphereGeometry args={[0.27, 12, 12]} />
      <meshStandardMaterial color="#aaaaaa" roughness={0.9} metalness={0} />
    </mesh>
  );
}

// ─── Progress Reporter (drives loading screen) ────────────────
function ProgressReporter() {
  const { progress, loaded, total } = useProgress();
  const { setLoadingProgress, setLoadingMessage } = useAppStore();
  useEffect(() => {
    if (total > 0) {
      const pct = Math.round((loaded / total) * 100);
      setLoadingProgress(Math.min(pct, 99));
      if (pct < 20) setLoadingMessage('Launching CosmosLearn...');
      else if (pct < 40) setLoadingMessage('Warming up the Sun...');
      else if (pct < 60) setLoadingMessage('Aligning planetary orbits...');
      else if (pct < 80) setLoadingMessage('Calibrating star charts...');
      else setLoadingMessage('Positioning satellites...');
    }
  }, [progress, loaded, total]);
  return null;
}

// ─── Scene Lighting ─────────────────────────────────────────────
function SceneLighting() {
  const sunLightRef = useRef<THREE.PointLight>(null!);
  const dirLightRef = useRef<THREE.DirectionalLight>(null!);
  useFrame(({ clock }) => {
    if (sunLightRef.current) sunLightRef.current.intensity = 2.5 + Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
  });

  return (
    <>
      <ambientLight intensity={0.08} color="#ffffff" />
      <pointLight ref={sunLightRef} position={[0, 0, 0]} intensity={2.5} distance={500} decay={1} color="#ffcc44" />
      <directionalLight ref={dirLightRef} position={[0, 0, 0]} intensity={1.5} color="#ffdd88"
        target-position={[1, 0, 0]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-far={200} shadow-camera-left={-80} shadow-camera-right={80}
        shadow-camera-top={80} shadow-camera-bottom={-80} />
      <pointLight position={[0, 40, 0]} intensity={6} color="#5577ff" distance={200} />
      <pointLight position={[-60, -20, -60]} intensity={3} color="#8844ff" distance={200} />
      <hemisphereLight color="#4488ff" groundColor="#110033" intensity={0.2} />
    </>
  );
}

// ─── Asteroid Belt (1800 InstancedMesh) ──────────────────────────
function AsteroidBelt() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const count = 1800;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const [speeds, phases] = useMemo(() => {
    const spd = new Float32Array(count);
    const pha = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      spd[i] = 0.0001 + Math.random() * 0.0004;
      pha[i] = Math.random() * Math.PI * 2;
    }
    return [spd, pha];
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const r = 46 + Math.random() * 8;
      const a = phases[i];
      dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 1.6, Math.sin(a) * r);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.setScalar(0.5 + Math.random() * 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const r = 46 + ((i * 1.7) % 8);
      const a = phases[i] + t * speeds[i];
      dummy.position.set(Math.cos(a) * r, (Math.sin(i * 2.3) * 0.8), Math.sin(a) * r);
      dummy.rotation.y += 0.01;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <dodecahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial color="#8B7355" roughness={1} metalness={0} />
    </instancedMesh>
  );
}

// ─── Nebula Sprites ─────────────────────────────────────────────
function NebulaSprites() {
  const tex = useMemo(() => createRadialGradientTexture([
    { pos: 0, color: 'rgba(255,255,255,0.3)' },
    { pos: 0.3, color: 'rgba(200,180,255,0.1)' },
    { pos: 1, color: 'rgba(0,0,0,0)' },
  ], 128), []);

  const sprites = useMemo(() => [
    { pos: [0, 30, -250], color: '#1a0033', size: 80, opacity: 0.1 },
    { pos: [0, -40, -300], color: '#000d1a', size: 100, opacity: 0.08 },
    { pos: [50, 20, -400], color: '#1a0033', size: 70, opacity: 0.06 },
    { pos: [-40, 10, -350], color: '#000d1a', size: 90, opacity: 0.12 },
    { pos: [20, -20, -500], color: '#1a0033', size: 60, opacity: 0.07 },
    { pos: [-30, 0, -200], color: '#000d1a', size: 75, opacity: 0.09 },
  ], []);

  return (
    <group>
      {sprites.map((s, i) => (
        <sprite key={i} position={s.pos as any} scale={[s.size, s.size, 1]}>
          <spriteMaterial map={tex} color={s.color} transparent opacity={s.opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

// ─── Starfield ──────────────────────────────────────────────────
function Starfield() {
  const count = useMemo(() => Math.min(12000, Math.max(3000, Math.floor(window.innerWidth * window.innerHeight * 0.008))), []);
  const ref = useRef<THREE.Points>(null!);
  const [positions, colors, sizes, twinkleSpeeds] = useMemo(() => {
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const siz = new Float32Array(count), tw = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 800 + Math.random() * 400, theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const b = 0.4 + Math.random() * 0.6, roll = Math.random();
      if (roll < 0.05) { col[i * 3] = b; col[i * 3 + 1] = b * 0.6; col[i * 3 + 2] = b * 0.3; siz[i] = 1 + Math.random() * 0.4; tw[i] = 0.3 + Math.random() * 0.5; }
      else if (roll < 0.08) { col[i * 3] = 0.4 * b; col[i * 3 + 1] = 0.5 * b; col[i * 3 + 2] = b; siz[i] = 0.6 + Math.random() * 0.6; tw[i] = 0.4 + Math.random() * 0.8; }
      else if (roll < 0.25) { col[i * 3] = b; col[i * 3 + 1] = b; col[i * 3 + 2] = b * 0.7; siz[i] = 0.4 + Math.random() * 0.4; tw[i] = roll < 0.18 ? 0.5 + Math.random() : 0; }
      else { col[i * 3] = b; col[i * 3 + 1] = b; col[i * 3 + 2] = b; siz[i] = 0.15 + Math.random() * 0.35; tw[i] = roll < 0.3 ? 0.5 + Math.random() * 1.5 : 0; }
    }
    return [pos, col, siz, tw];
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const e = clock.getElapsedTime(), sa = ref.current.geometry.attributes.size.array as Float32Array;
    for (let i = 0; i < count; i++) { if (twinkleSpeeds[i] > 0) sa[i] = sizes[i] * (0.6 + Math.sin(e * twinkleSpeeds[i] + i) * 0.4); }
    ref.current.geometry.attributes.size.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={0.5} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ─── Milky Way ──────────────────────────────────────────────────
function MilkyWayBand() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.003; });
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(180,160,220,0.04)');
  g.addColorStop(0.48, 'rgba(200,180,240,0.08)'); g.addColorStop(0.5, 'rgba(220,200,255,0.12)');
  g.addColorStop(0.52, 'rgba(200,180,240,0.08)'); g.addColorStop(0.55, 'rgba(180,160,220,0.04)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 512);
  const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
  return (
    <mesh ref={ref} rotation={[Math.PI * 0.3, 0, 0]}>
      <planeGeometry args={[800, 300]} />
      <meshBasicMaterial map={tex} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Shooting Stars ─────────────────────────────────────────────
function ShootingStars() {
  const count = 30;
  const ref = useRef<THREE.Points>(null!);

  const state = useRef({
    pos: new Float32Array(count * 3),
    ages: new Float32Array(count).fill(0),
    lives: new Float32Array(count).fill(0),
    sizes: new Float32Array(count).fill(0),
  });

  const initPos = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) p[i] = 0;
    return p;
  }, []);

  useFrame(() => {
    const s = state.current;
    const dt = 0.016;
    let anyActive = false;

    for (let i = 0; i < count; i++) {
      s.ages[i] -= dt;
      if (s.ages[i] <= 0) {
        s.sizes[i] = 0;
        if (Math.random() < 0.008) {
          const theta = -Math.PI * 0.3 + Math.random() * 0.6;
          const phi = Math.random() * Math.PI * 2;
          const r = 150 + Math.random() * 200;
          s.pos[i * 3] = r * Math.cos(theta) * Math.cos(phi);
          s.pos[i * 3 + 1] = 60 + Math.random() * 80;
          s.pos[i * 3 + 2] = r * Math.cos(theta) * Math.sin(phi);
          s.ages[i] = 2 + Math.random() * 4;
          s.lives[i] = s.ages[i];
        }
      }
      if (s.ages[i] > 0) {
        anyActive = true;
        s.pos[i * 3] -= 80 * dt;
        s.pos[i * 3 + 1] -= 60 * dt;
        s.pos[i * 3 + 2] -= 20 * dt;
        const progress = 1 - s.ages[i] / s.lives[i];
        const fade = progress < 0.1 ? progress / 0.1 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        s.sizes[i] = fade * 2;
      }
    }

    if (ref.current) {
      const geo = ref.current.geometry;
      (geo.attributes.position.array as Float32Array).set(s.pos);
      (geo.attributes.size.array as Float32Array).set(s.sizes);
      geo.attributes.position.needsUpdate = true;
      geo.attributes.size.needsUpdate = true;
      (ref.current.material as THREE.PointsMaterial).opacity = anyActive ? 0.8 : 0;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={initPos} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={new Float32Array(count).fill(0)} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={2} transparent opacity={0} color="#ffffff" blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}
// ─── Constellations ────────────────────────────────────────────
const constellationData: { name: string; stars: [number, number, number][]; lines: [number, number][] }[] = [
  { name: 'Ursa Major', stars: [[-320, 45, -280], [-310, 48, -270], [-300, 50, -265], [-290, 52, -260], [-280, 50, -255], [-270, 47, -250], [-260, 44, -245]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[3,6]] },
  { name: 'Orion', stars: [[150, 20, -320],[145, 15, -315],[140, 10, -310],[135, 12, -305],[130, 14, -300],[125, 10, -295],[120, 5, -290]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
  { name: 'Cassiopeia', stars: [[-100, 80, -350], [-90, 75, -340], [-80, 70, -330], [-70, 75, -320], [-60, 80, -310]], lines: [[0,1],[1,2],[2,3],[3,4]] },
  { name: 'Leo', stars: [[200, 30, -300],[210, 28, -290],[220, 25, -280],[230, 22, -270],[240, 20, -260],[250, 25, -250]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5]] },
  { name: 'Scorpius', stars: [[-250, -30, -350],[-240, -25, -340],[-230, -20, -330],[-220, -15, -320],[-210, -10, -310],[-200, -5, -300],[-190, 0, -290]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]] },
];

function Constellations() {
  const { settings } = useAppStore();
  if (!settings.showConstellations) return null;

  return (
    <group>
      {constellationData.map((constellation, ci) => (
        <group key={ci}>
          {constellation.stars.map((pos, si) => (
            <mesh key={si} position={pos}>
              <sphereGeometry args={[0.4, 4, 4]} />
              <meshBasicMaterial color="#88ddff" transparent opacity={0.6} />
            </mesh>
          ))}
          {constellation.lines.map(([from, to], li) => {
            const p1 = constellation.stars[from];
            const p2 = constellation.stars[to];
            const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2] as const;
            return (
              <DreiLine key={li} points={[p1, p2]} color="#88ddff" lineWidth={0.3} transparent opacity={0.15} depthWrite={false} />
            );
          })}
          <Html position={[constellation.stars[0][0], constellation.stars[0][1] + 5, constellation.stars[0][2]]} center>
            <div className="text-[8px] text-cyan-300/40 tracking-widest uppercase font-mono whitespace-nowrap pointer-events-none select-none">
              {constellation.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ─── Axis Line ──────────────────────────────────────────────────
function AxisLine({ tilt, radius }: { tilt: number; radius: number }) {
  const h = radius * 2.2;
  const ref = useRef<THREE.Line>(null!);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -h, 0, 0, h, 0]), 3));
    return g;
  }, [h]);
  return (
    <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.08, depthWrite: false }))} rotation={[tilt * Math.PI / 180, 0, 0]} />
  );
}

// ─── Distance Indicator ─────────────────────────────────────────
function DistanceIndicator({ label }: { label: string }) {
  return (
    <Html position={[0, -1.8, 0]} center>
      <div className="text-[7px] text-white/20 tracking-wider whitespace-nowrap font-mono pointer-events-none select-none">
        {label}
      </div>
    </Html>
  );
}

// ─── Hover Tooltip ──────────────────────────────────────────────
function HoverTooltip({ planet }: { planet: typeof planets[0] }) {
  return (
    <Html position={[0, 1.4, 0]} center>
      <div className="glass-strong rounded-lg px-3 py-2 min-w-[120px] pointer-events-none select-none">
        <div className="text-xs font-bold text-white mb-1">{planet.name}</div>
        <div className="text-[8px] text-white/40 mb-1">{planet.type}</div>
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[7px]">
            <span className="text-white/30">Diameter</span>
            <span className="text-white/60">{planet.diameter}</span>
          </div>
          <div className="flex justify-between text-[7px]">
            <span className="text-white/30">Gravity</span>
            <span className="text-white/60">{planet.gravity}</span>
          </div>
          <div className="flex justify-between text-[7px]">
            <span className="text-white/30">Temp</span>
            <span className="text-white/60">{planet.temperature}</span>
          </div>
          <div className="flex justify-between text-[7px]">
            <span className="text-white/30">Moons</span>
            <span className="text-white/60">{planet.moons}</span>
          </div>
        </div>
      </div>
    </Html>
  );
}
// ─── Camera Controller ──────────────────────────────────────────
function CameraController() {
  const { settings, selectedPlanet, selectPlanet, setShowPanel } = useAppStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isFlyingRef = useRef(false);
  const flyTargetRef = useRef(new THREE.Vector3());
  const flyLookAtRef = useRef(new THREE.Vector3());
  const flyFramesRef = useRef(0);
  const defaultPos = useRef(new THREE.Vector3(60, 35, 90));
  const defaultLook = useRef(new THREE.Vector3(0, 0, 0));
  const isMobile = useRef(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => { isMobile.current = window.innerWidth < 768; };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleDoubleClick = useCallback(() => {
    selectPlanet(null);
    setShowPanel(false);
    isFlyingRef.current = true;
    flyTargetRef.current.copy(defaultPos.current);
    flyLookAtRef.current.copy(defaultLook.current);
    flyFramesRef.current = 60;
  }, [selectPlanet, setShowPanel]);

  useEffect(() => {
    window.addEventListener('dblclick', handleDoubleClick);
    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, [handleDoubleClick]);

  const resetView = useCallback(() => {
    isFlyingRef.current = true;
    flyTargetRef.current.copy(defaultPos.current);
    flyLookAtRef.current.copy(defaultLook.current);
    flyFramesRef.current = 60;
  }, []);

  const instantResetView = useCallback(() => {
    isFlyingRef.current = false;
    camera.position.copy(defaultPos.current);
    if (controlsRef.current) controlsRef.current.target.copy(defaultLook.current);
  }, [camera]);

  (window as any).__resetCamera = resetView;
  (window as any).__instantResetCamera = instantResetView;

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime() * settings.timeSpeed;

    if (isFlyingRef.current && flyFramesRef.current > 0) {
      const lerpFactor = 1 / Math.max(1, flyFramesRef.current);
      camera.position.lerp(flyTargetRef.current, lerpFactor);
      if (controlsRef.current) controlsRef.current.target.lerp(flyLookAtRef.current, lerpFactor);
      flyFramesRef.current--;
      if (flyFramesRef.current <= 0) isFlyingRef.current = false;
      return;
    }

    if (selectedPlanet) {
      const planet = selectedPlanet;
      const planetIndex = planets.findIndex(p => p.id === planet.id) - 1;
      const totalPlanets = planets.filter(p => p.id !== 'sun').length;
      const startAngle = (planetIndex * Math.PI * 2) / totalPlanets;
      const orbitAngle = startAngle + elapsed * planet.orbitalSpeed * 0.1;
      const px = Math.cos(orbitAngle) * planet.orbitRadius;
      const pz = Math.sin(orbitAngle) * planet.orbitRadius;
      if (controlsRef.current) controlsRef.current.target.lerp(new THREE.Vector3(px, 0, pz), 0.04);
      const offset = Math.max(18, planet.size * 2.5 + 10) * (isMobile.current ? 0.6 : 1);
      const height = Math.max(6, planet.size * 1.8) * (isMobile.current ? 0.5 : 1);
      camera.position.lerp(new THREE.Vector3(px + offset * 0.6, height, pz + offset), 0.03);
    } else {
      if (controlsRef.current) controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.02);
      const orbit = elapsed * 0.015;
      camera.position.lerp(new THREE.Vector3(Math.cos(orbit) * 63, 30 + Math.sin(orbit * 0.5) * 10, Math.sin(orbit) * 90), 0.01);
    }
  });

  return (
    <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05}
      minDistance={20} maxDistance={200}
      autoRotate={false} rotateSpeed={0.5} zoomSpeed={0.8} target={[0, 0, 0]}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} />
  );
}

// ─── Reset View Button ──────────────────────────────────────────
function ResetViewButton() {
  return (
    <button onClick={() => { (window as any).__resetCamera?.(); }}
      className="fixed top-4 left-4 z-50 glass-strong rounded-xl px-4 py-2 text-xs uppercase tracking-widest
        text-white/70 hover:text-cosmic-neon border border-white/10 hover:border-cosmic-neon/30 transition-all">
      Reset View
    </button>
  );
}

// ─── Speed Control ──────────────────────────────────────────────
function SpeedControl() {
  const { settings, setTimeSpeed } = useAppStore();
  return (
    <div className="fixed bottom-6 right-6 z-50 glass-strong rounded-xl p-4 min-w-[160px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-white/50">Orbit Speed</span>
        <span className="text-xs font-mono text-cosmic-neon">{settings.timeSpeed.toFixed(1)}x</span>
      </div>
      <input type="range" min={0.1} max={5} step={0.1} value={settings.timeSpeed}
        onChange={(e) => setTimeSpeed(parseFloat(e.target.value))}
        className="w-full h-1 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cosmic-neon
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-white/30">0.1x</span>
        <span className="text-[8px] text-white/30">5x</span>
      </div>
    </div>
  );
}

// ─── Main Scene ──────────────────────────────────────────────────
function Scene() {
  const planetList = useMemo(() => planets.filter(p => p.id !== 'sun'), []);
  return (
    <>
      <fog attach="fog" args={['#000011', 250, 600]} />
      <ProgressReporter />
      <SceneLighting />
      <NebulaSprites />
      <MilkyWayBand />
      <Sun />
      {planetList.map((planet, i) => (
        <React.Fragment key={planet.id}>
          <OrbitLine planet={planet} index={i} />
          <TrailComet planet={planet} index={i} />
          <Planet planet={planet} index={i} />
        </React.Fragment>
      ))}
      <AsteroidBelt />
      <ShootingStars />
      <Constellations />
      <Starfield />
      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.25} luminanceSmoothing={0.9} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.6} />
      </EffectComposer>
    </>
  );
}

// ─── SolarSystem ────────────────────────────────────────────────
export default function SolarSystem() {
  return (
    <div className="fixed inset-0 w-full h-full">
      <Canvas camera={{ position: [60, 35, 90], fov: 55, near: 0.1, far: 600 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0, powerPreference: 'high-performance', outputColorSpace: THREE.SRGBColorSpace }}
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}>
        <Suspense fallback={null}>
          <Scene />
          <CameraController />
        </Suspense>
      </Canvas>
      <ResetViewButton />
      <SpeedControl />
    </div>
  );
}
