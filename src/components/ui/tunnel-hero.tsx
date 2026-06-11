"use client"

import * as THREE from "three"
import { useRef, useEffect, useState, useCallback } from "react"

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as any).matches)
    setIsMobile(mq.matches)
    try {
      mq.addEventListener("change", onChange as any)
      return () => mq.removeEventListener("change", onChange as any)
    } catch {
      mq.addListener(onChange as any)
      return () => mq.removeListener(onChange as any)
    }
  }, [breakpoint])

  return isMobile
}

const vertexShader = `void main(){ gl_Position = vec4(position, 1.0); }`

const fragmentShader = `
uniform float iTime;
uniform vec3 iResolution;

#define TAU 6.2831853071795865
#define TUNNEL_LAYERS 96
#define RING_POINTS 128
#define POINT_SIZE 1.8
#define POINT_COLOR_A vec3(0.0, 0.83, 1.0)
#define POINT_COLOR_B vec3(0.5, 0.2, 1.0)
#define SPEED 0.7

float sq(float x){ return x*x; }

vec2 AngRep(vec2 uv, float angle){
  vec2 polar = vec2(atan(uv.y, uv.x), length(uv));
  polar.x = mod(polar.x + angle/2.0, angle) - angle/2.0;
  return polar.y * vec2(cos(polar.x), sin(polar.x));
}

float sdCircle(vec2 uv, float r){ return length(uv) - r; }

vec3 MixShape(float sd, vec3 fill, vec3 target){
  float blend = smoothstep(0.0, 1.0/iResolution.y, sd);
  return mix(fill, target, blend);
}

vec2 TunnelPath(float x){
  vec2 offs = vec2(
    0.2 * sin(TAU * x * 0.5) + 0.4 * sin(TAU * x * 0.2 + 0.3),
    0.3 * cos(TAU * x * 0.3) + 0.2 * cos(TAU * x * 0.1)
  );
  offs *= smoothstep(1.0, 4.0, x);
  return offs;
}

void main(){
  vec2 res = iResolution.xy / iResolution.y;
  vec2 uv = gl_FragCoord.xy / iResolution.y - res/2.0;
  vec3 color = vec3(0.0);
  float repAngle = TAU / float(RING_POINTS);
  float pointSize = POINT_SIZE / (2.0 * iResolution.y);
  float camZ = iTime * SPEED;
  vec2 camOffs = TunnelPath(camZ);

  for(int i = 1; i <= TUNNEL_LAYERS; i++){
    float pz = 1.0 - (float(i) / float(TUNNEL_LAYERS));
    pz -= mod(camZ, 4.0 / float(TUNNEL_LAYERS));
    vec2 offs = TunnelPath(camZ + pz) - camOffs;
    float ringRad = 0.15 * (1.0 / sq(pz * 0.8 + 0.4));
    if(abs(length(uv + offs) - ringRad) < pointSize * 1.5){
      vec2 aruv = AngRep(uv + offs, repAngle);
      float pdist = sdCircle(aruv - vec2(ringRad, 0), pointSize);
      vec3 ptColor = (mod(float(i/2), 2.0) == 0.0) ? POINT_COLOR_A : POINT_COLOR_B;
      float shade = (1.0 - pz);
      color = MixShape(pdist, ptColor * shade, color);
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`

type ThreeContext = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  material: THREE.ShaderMaterial
  mesh: THREE.Mesh
  geometry: THREE.PlaneGeometry
}

function createThreeForCanvas(canvas: HTMLCanvasElement, width: number, height: number): ThreeContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const material = new THREE.ShaderMaterial({
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(width, height, 1) },
    },
    vertexShader,
    fragmentShader,
  })

  const geometry = new THREE.PlaneGeometry(2, 2)
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  return { renderer, scene, camera, material, mesh, geometry }
}

function disposeThree(ctx: ThreeContext) {
  try {
    ctx.scene.remove(ctx.mesh)
    ctx.mesh.geometry.dispose()
    ctx.material.dispose()
    ctx.renderer.dispose()
  } catch { /* ignore */ }
}

interface TunnelHeroProps {
  onStart?: () => void;
}

export default function TunnelHero({ onStart }: TunnelHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<ThreeContext | null>(null)
  const lastTimeRef = useRef<number>(0)
  const animRef = useRef<number | null>(null)
  const pausedRef = useRef<boolean>(false)
  const rafResizeRef = useRef<boolean>(false)
  const isMobile = useIsMobile()

  const animate = useCallback((time: number) => {
    if (!ctxRef.current) return
    animRef.current = requestAnimationFrame(animate)
    if (pausedRef.current) { lastTimeRef.current = time; return }
    time *= 0.001
    const delta = time - (lastTimeRef.current || time)
    lastTimeRef.current = time
    ctxRef.current.material.uniforms.iTime.value += delta * 0.5
    ctxRef.current.renderer.render(ctxRef.current.scene, ctxRef.current.camera)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof window === "undefined") return

    const width = window.innerWidth
    const height = window.innerHeight
    const ctx = createThreeForCanvas(canvas, width, height)
    ctxRef.current = ctx

    const handleResize = () => {
      if (!ctxRef.current) return
      if (rafResizeRef.current) return
      rafResizeRef.current = true
      requestAnimationFrame(() => {
        rafResizeRef.current = false
        const w = window.innerWidth
        const h = window.innerHeight
        ctxRef.current!.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        ctxRef.current!.renderer.setSize(w, h)
        ;(ctxRef.current!.material.uniforms.iResolution.value as THREE.Vector3).set(w, h, 1)
      })
    }
    window.addEventListener("resize", handleResize)

    const handleVisibility = () => { pausedRef.current = !!document.hidden }
    document.addEventListener("visibilitychange", handleVisibility)
    handleVisibility()

    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibility)
      if (ctxRef.current) { disposeThree(ctxRef.current); ctxRef.current = null }
    }
  }, [animate])

  return (
    <div className="bg-black text-white min-h-screen overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full"
      />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className={`${isMobile ? "mb-4 space-y-2" : "mb-8 space-y-3 md:space-y-6"}`}>
          <div className="inline-block">
            <h1 className={`${isMobile ? "text-4xl" : "text-7xl md:text-9xl"} font-black tracking-tighter bg-gradient-to-r from-cosmic-neon via-cosmic-purple to-cosmic-pink bg-clip-text text-transparent`}>
              COSMOSLEARN
            </h1>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cosmic-neon to-transparent mt-2 md:mt-4" />
          </div>
          <p className={`${isMobile ? "text-sm px-4" : "text-lg md:text-xl"} text-gray-300 max-w-2xl font-light mx-auto`}>
            Explore the solar system through an immersive 3D experience powered by AI
          </p>
          <div className="flex gap-4 justify-center mt-6">
            {onStart ? (
              <button
                onClick={onStart}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cosmic-neon to-cosmic-purple text-white font-bold text-sm tracking-wider uppercase transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(0,212,255,0.3)]"
              >
                Begin Journey
              </button>
            ) : (
              <a
                href="#explore"
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cosmic-neon to-cosmic-purple text-white font-bold text-sm tracking-wider uppercase transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(0,212,255,0.3)]"
              >
                Begin Journey
              </a>
            )}
            <a
              href="#about"
              className="px-8 py-3 rounded-2xl glass-strong text-white/70 font-bold text-sm tracking-wider uppercase transition-all hover:scale-105 hover:text-white"
            >
              Learn More
            </a>
          </div>
        </div>
        <div className={`absolute bottom-8 text-[10px] text-white/20 tracking-wider font-mono ${isMobile ? "text-[8px]" : ""}`}>
          An AI-Powered Space Explorer
        </div>
      </div>
    </div>
  )
}
