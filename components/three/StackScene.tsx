"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { montar, damp } from "./kit";

// La existencia de un anuncio, apilada sobre una tarima. Cuando el vendedor cambia la
// cantidad, las piezas que sobran salen volando y las nuevas caen en su lugar.

export type TipoPila = "sacos" | "block" | "barras" | "madera" | "tablas" | "tubos" | "cubetas" | "cajas" | "pila" | "rollos" | "maquina";

export function tipoPila(subId: string): TipoPila {
  const m: Record<string, TipoPila> = {
    cemento: "sacos",
    varilla: "barras",
    block: "block",
    agregados: "pila",
    malla: "rollos",
    pisos: "cajas",
    pintura: "cubetas",
    puertas: "tablas",
    banos: "cajas",
    tuberia: "tubos",
    electrico: "rollos",
    tinacos: "cubetas",
    triplay: "tablas",
    polines: "madera",
    cimbra: "tubos",
    electricas: "cajas",
    manuales: "cajas",
    andamios: "tubos",
    revolvedoras: "maquina",
    compactacion: "maquina",
    carga: "maquina",
    generadores: "maquina",
  };
  return m[subId] ?? "cajas";
}

interface Props {
  tipo: TipoPila;
  cantidad: number;
  maximo: number;
}

const CAP: Record<TipoPila, number> = { sacos: 24, block: 60, barras: 40, madera: 30, tablas: 18, tubos: 21, cubetas: 12, cajas: 16, pila: 1, rollos: 9, maquina: 4 };

function slot(tipo: TipoPila, i: number): [number, number, number, number] {
  // x, y, z, giro
  switch (tipo) {
    case "sacos": {
      const capa = Math.floor(i / 4);
      const j = i % 4;
      const g = capa % 2 === 0;
      return g ? [j % 2 ? 0.34 : -0.34, 0.27 + capa * 0.17, j < 2 ? -0.24 : 0.24, 0] : [j < 2 ? -0.24 : 0.24, 0.27 + capa * 0.17, j % 2 ? 0.34 : -0.34, Math.PI / 2];
    }
    case "block": {
      const capa = Math.floor(i / 12);
      const j = i % 12;
      return [(j % 3) * 0.4 - 0.4, 0.29 + capa * 0.2, Math.floor(j / 3) * 0.2 - 0.3, 0];
    }
    case "barras":
    case "madera": {
      const fila = Math.floor(i / 8);
      const col = i % 8;
      const d = tipo === "madera" ? 0.11 : 0.06;
      return [0, 0.25 + fila * d * 0.9, (col - 3.5) * d + (fila % 2) * d * 0.5, 0];
    }
    case "tablas":
      return [0, 0.21 + i * 0.035, 0, (i % 3) * 0.008];
    case "tubos": {
      let fila = 0;
      let n = i;
      while (n >= 6 - fila && fila < 5) {
        n -= 6 - fila;
        fila++;
      }
      return [0, 0.27 + fila * 0.16, (n - (5 - fila) / 2) * 0.18, 0];
    }
    case "cubetas": {
      const capa = Math.floor(i / 6);
      const j = i % 6;
      return [(j % 3) * 0.42 - 0.42, 0.42 + capa * 0.4, Math.floor(j / 3) * 0.42 - 0.21, 0];
    }
    case "cajas": {
      const capa = Math.floor(i / 4);
      const j = i % 4;
      return [(j % 2) * 0.62 - 0.31, 0.3 + capa * 0.25, Math.floor(j / 2) * 0.5 - 0.25, (capa % 2) * 0.05];
    }
    case "rollos": {
      const capa = Math.floor(i / 3);
      const j = i % 3;
      return [(j - 1) * 0.5, 0.42 + capa * 0.42, 0, 0];
    }
    case "maquina":
      return [(i % 2) * 0.9 - 0.45, 0.48, Math.floor(i / 2) * 0.8 - 0.4, 0];
    default:
      return [0, 0.3, 0, 0];
  }
}

function geometria(tipo: TipoPila): { g: THREE.BufferGeometry; color: number; metal?: number; rough?: number } {
  switch (tipo) {
    case "sacos":
      return { g: new RoundedBoxGeometry(0.66, 0.17, 0.46, 3, 0.07), color: 0xc9a46c, rough: 0.92 };
    case "block":
      return { g: new THREE.BoxGeometry(0.38, 0.19, 0.19), color: 0xa7a299, rough: 0.97 };
    case "barras":
      return { g: new THREE.CylinderGeometry(0.026, 0.026, 2.3, 6).rotateZ(Math.PI / 2), color: 0x7a4a2c, metal: 0.65, rough: 0.5 };
    case "madera":
      return { g: new THREE.BoxGeometry(2.2, 0.1, 0.1), color: 0xb98c58, rough: 0.85 };
    case "tablas":
      return { g: new THREE.BoxGeometry(1.9, 0.03, 1.0), color: 0xd8b886, rough: 0.8 };
    case "tubos":
      return { g: new THREE.CylinderGeometry(0.08, 0.08, 2.2, 16, 1, true).rotateZ(Math.PI / 2), color: 0xd66a3c, rough: 0.45 };
    case "cubetas":
      return { g: new THREE.CylinderGeometry(0.17, 0.15, 0.38, 20), color: 0xe9e4dc, rough: 0.5 };
    case "cajas":
      return { g: new RoundedBoxGeometry(0.58, 0.24, 0.46, 2, 0.02), color: 0xc7a983, rough: 0.9 };
    case "rollos":
      return { g: new THREE.CylinderGeometry(0.21, 0.21, 0.3, 24).rotateX(Math.PI / 2), color: 0x2b5566, rough: 0.6 };
    case "maquina":
      return { g: new RoundedBoxGeometry(0.8, 0.6, 0.66, 3, 0.06), color: 0xd06135, metal: 0.25, rough: 0.45 };
    default:
      return { g: new THREE.BoxGeometry(0.4, 0.4, 0.4), color: 0xaaaaaa };
  }
}

export default function StackScene({ tipo, cantidad, maximo }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const objetivo = useRef(0);
  const cap = CAP[tipo];
  objetivo.current = tipo === "pila" ? Math.min(1, cantidad / Math.max(1, maximo)) : cantidad <= 0 ? 0 : Math.max(1, Math.round(Math.min(1, cantidad / Math.max(1, maximo)) * cap));

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { sombras: true, dprEscritorio: 1.5 });
    if (!k) return;
    const { scene, renderer, track, reduce } = k;
    scene.environmentIntensity = 0.6;
    const camera = new THREE.PerspectiveCamera(32, k.size().w / k.size().h, 0.1, 60);
    k.onResize((w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb4a690, 0.8));
    const sol = new THREE.DirectionalLight(0xfff0da, 2.2);
    sol.position.set(3, 6, 4);
    if (renderer.shadowMap.enabled) {
      sol.castShadow = true;
      sol.shadow.mapSize.set(512, 512);
      sol.shadow.camera.left = sol.shadow.camera.bottom = -3;
      sol.shadow.camera.right = sol.shadow.camera.top = 3;
      sol.shadow.radius = 3;
    }
    scene.add(sol);

    const piso = new THREE.Mesh(track(new THREE.CircleGeometry(4, 48).rotateX(-Math.PI / 2)), new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 1 }));
    piso.receiveShadow = true;
    scene.add(piso);

    const grupo = new THREE.Group();
    scene.add(grupo);
    const madera = new THREE.MeshStandardMaterial({ color: 0x9e7349, roughness: 0.85 });
    if (tipo !== "pila") {
      const tabla = track(new THREE.BoxGeometry(1.5, 0.035, 0.18));
      for (let n = 0; n < 5; n++) {
        const m = new THREE.Mesh(tabla, madera);
        m.position.set(0, 0.135, -0.48 + n * 0.24);
        m.castShadow = m.receiveShadow = true;
        grupo.add(m);
      }
      const taco = track(new THREE.BoxGeometry(0.12, 0.1, 1.15));
      for (const x of [-0.62, 0, 0.62]) {
        const m = new THREE.Mesh(taco, madera);
        m.position.set(x, 0.065, 0);
        m.castShadow = true;
        grupo.add(m);
      }
    }

    let mesh: THREE.InstancedMesh | null = null;
    let monte: THREE.Mesh | null = null;
    const vivos: { s: number; y: number }[] = [];
    if (tipo === "pila") {
      monte = new THREE.Mesh(track(new THREE.ConeGeometry(1.1, 0.9, 40, 1).translate(0, 0.45, 0)), new THREE.MeshStandardMaterial({ color: 0xbfae93, roughness: 1 }));
      monte.castShadow = monte.receiveShadow = true;
      grupo.add(monte);
    } else {
      const { g, color, metal, rough } = geometria(tipo);
      track(g);
      mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color, metalness: metal ?? 0, roughness: rough ?? 0.8, side: tipo === "tubos" ? THREE.DoubleSide : THREE.FrontSide }), cap);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      grupo.add(mesh);
      for (let n = 0; n < cap; n++) vivos.push({ s: 0, y: 1.5 });
    }

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    let giro = 0;
    let pulso = 0;
    const onPulso = (ev: Event) => {
      if ((ev as CustomEvent).detail === "cantidad") pulso = 1;
    };
    window.addEventListener("patio:pulso", onPulso);
    let ptrX = 0;
    const onMove = (ev: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      ptrX = ((ev.clientX - r.left) / r.width - 0.5) * 2;
    };
    mount.addEventListener("pointermove", onMove);

    let montoActual = 0;
    k.loop((dt, t) => {
      giro = damp(giro, ptrX * 0.5, 3, dt);
      const ang = 0.75 + giro + (reduce ? 0 : Math.sin(t * 0.3) * 0.12);
      camera.position.set(Math.sin(ang) * 4.6, 2.6, Math.cos(ang) * 4.6);
      camera.lookAt(0, 0.55, 0);
      pulso = Math.max(0, pulso - dt * 1.5);
      grupo.position.y = Math.sin(pulso * Math.PI) * 0.05;

      if (monte) {
        montoActual = damp(montoActual, objetivo.current, 4, dt);
        const s = Math.max(0.001, montoActual);
        monte.scale.set(Math.cbrt(s), Math.cbrt(s), Math.cbrt(s));
        monte.visible = montoActual > 0.01;
      }
      if (mesh) {
        const n = objetivo.current;
        vivos.forEach((x, i) => {
          const dentro = i < n;
          x.s = damp(x.s, dentro ? 1 : 0, dentro ? 7 : 5, dt);
          x.y = damp(x.y, dentro ? 0 : 1.2, dentro ? 6 : 3, dt);
          const [px, py, pz, r] = slot(tipo, i);
          q.setFromEuler(e.set(0, r, 0));
          sc.setScalar(Math.max(0.0001, x.s));
          m4.compose(v.set(px, py + x.y, pz), q, sc);
          mesh!.setMatrixAt(i, m4);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("patio:pulso", onPulso);
      mount.removeEventListener("pointermove", onMove);
      k.dispose();
    };
  }, [tipo, cap]);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />;
}
