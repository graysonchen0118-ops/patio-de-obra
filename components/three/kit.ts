import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Lo que todas las escenas comparten: tamaño que sigue al contenedor, densidad de píxeles
// limitada, pausa cuando la escena no se ve o la pestaña está oculta, y limpieza al salir.
export interface Escena {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  small: boolean;
  reduce: boolean;
  size: () => { w: number; h: number };
  onResize: (fn: (w: number, h: number) => void) => void;
  loop: (fn: (dt: number, t: number) => void) => void;
  track: <T extends { dispose: () => void }>(x: T) => T;
  dispose: () => void;
}

export function montar(mount: HTMLElement, opts: { sombras?: boolean; dprEscritorio?: number; ambiente?: boolean; suavizado?: boolean } = {}): Escena | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: opts.suavizado ?? true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const small = window.innerWidth < 768;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : opts.dprEscritorio ?? 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  if (opts.sombras && !small) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  if (opts.ambiente !== false) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    track(env);
    pmrem.dispose();
  }

  let w = Math.max(1, mount.clientWidth);
  let h = Math.max(1, mount.clientHeight);
  renderer.setSize(w, h, false);
  const resizers: ((w: number, h: number) => void)[] = [];
  const ro = new ResizeObserver(() => {
    const nw = Math.max(1, mount.clientWidth);
    const nh = Math.max(1, mount.clientHeight);
    if (nw === w && nh === h) return;
    w = nw;
    h = nh;
    renderer.setSize(w, h, false);
    resizers.forEach((f) => f(w, h));
  });
  ro.observe(mount);

  let enPantalla = true;
  const io = new IntersectionObserver((e) => (enPantalla = e[0]?.isIntersecting ?? true), { rootMargin: "120px" });
  io.observe(mount);

  let raf = 0;
  const clock = new THREE.Clock();
  let fn: ((dt: number, t: number) => void) | null = null;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!enPantalla || document.visibilityState === "hidden") {
      clock.getDelta();
      return;
    }
    const dt = Math.min(clock.getDelta(), 0.25);
    fn?.(dt, clock.elapsedTime);
  };
  raf = requestAnimationFrame(tick);

  return {
    renderer,
    scene,
    small,
    reduce,
    size: () => ({ w, h }),
    onResize: (f) => resizers.push(f),
    loop: (f) => (fn = f),
    track,
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
  };
}

export const css = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

// Sombra de contacto suave: un plano con degradado radial. Mucho más barata que un mapa
// de sombras y se ve igual de asentada bajo una tarima.
let texSombra: THREE.CanvasTexture | null = null;
export function sombraSuave(w: number, d: number, opacidad = 0.38) {
  if (!texSombra) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    r.addColorStop(0, "rgba(40,30,20,1)");
    r.addColorStop(0.55, "rgba(40,30,20,0.45)");
    r.addColorStop(1, "rgba(40,30,20,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    texSombra = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, opacity: opacidad, depthWrite: false }));
  m.renderOrder = 1;
  return m;
}

// El color de la marca, leído de la paleta del sitio para que el 3D cambie con ella.
export function acento() {
  return new THREE.Color(css("--accent", "#b5452b"));
}
export function acentoClaro() {
  return new THREE.Color(css("--accent-2", "#d66a3c"));
}
