"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { montar, damp } from "./kit";

// Cada lote de créditos es una columna de fichas. La ficha de arriba del lote que vence
// primero brilla: es la siguiente que se gasta. Al usarla sale volando; lo vencido se
// queda gris y se hunde.

export interface ColumnaLote {
  id: string;
  restantes: number;
  vencidos: number;
  origen: "bienvenida" | "compra" | "ajuste";
  siguiente: boolean;
}

const MAX = 25;

export default function CreditScene({ lotes }: { lotes: ColumnaLote[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const datos = useRef(lotes);
  datos.current = lotes;

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { sombras: true, dprEscritorio: 1.5 });
    if (!k) return;
    const { scene, renderer, track, reduce } = k;
    scene.environmentIntensity = 0.7;
    const camera = new THREE.PerspectiveCamera(30, k.size().w / k.size().h, 0.1, 80);
    k.onResize((w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbcae98, 0.9));
    const sol = new THREE.DirectionalLight(0xfff2de, 2);
    sol.position.set(2, 7, 5);
    if (renderer.shadowMap.enabled) {
      sol.castShadow = true;
      sol.shadow.mapSize.set(1024, 512);
      sol.shadow.camera.left = -6;
      sol.shadow.camera.right = 6;
      sol.shadow.camera.top = 4;
      sol.shadow.camera.bottom = -2;
      sol.shadow.radius = 3;
    }
    scene.add(sol);
    const piso = new THREE.Mesh(track(new THREE.PlaneGeometry(30, 12).rotateX(-Math.PI / 2)), new THREE.ShadowMaterial({ opacity: 0.16 }));
    piso.receiveShadow = true;
    scene.add(piso);

    const ficha = track(new THREE.CylinderGeometry(0.42, 0.42, 0.075, 40));
    const canto = track(new THREE.TorusGeometry(0.42, 0.012, 6, 40).rotateX(Math.PI / 2));
    const mats = {
      compra: new THREE.MeshStandardMaterial({ color: 0xc4532f, roughness: 0.3, metalness: 0.35, emissive: 0xb5452b, emissiveIntensity: 0 }),
      bienvenida: new THREE.MeshStandardMaterial({ color: 0x2b5566, roughness: 0.3, metalness: 0.35, emissive: 0x2b5566, emissiveIntensity: 0 }),
      ajuste: new THREE.MeshStandardMaterial({ color: 0x8a7b5c, roughness: 0.35, metalness: 0.3 }),
      vencido: new THREE.MeshStandardMaterial({ color: 0xb9b4ac, roughness: 0.8, transparent: true, opacity: 0.55 }),
      siguiente: new THREE.MeshStandardMaterial({ color: 0xe3864f, roughness: 0.25, metalness: 0.4, emissive: 0xd66a3c, emissiveIntensity: 0.5 }),
      orilla: new THREE.MeshStandardMaterial({ color: 0xf3e2c7, roughness: 0.3, metalness: 0.6 }),
    };
    Object.values(mats).forEach((m) => track(m));

    type Col = { id: string; g: THREE.Group; fichas: THREE.Mesh[]; grises: THREE.Mesh[]; x: number; tx: number };
    const cols = new Map<string, Col>();
    const voladoras: { m: THREE.Mesh; v: THREE.Vector3; t: number; mat: THREE.MeshStandardMaterial }[] = [];

    const sincronizar = () => {
      const lista = datos.current.slice(0, 5);
      const sep = 2.1;
      const off = ((lista.length - 1) * sep) / 2;
      const vistos = new Set<string>();
      lista.forEach((l, n) => {
        vistos.add(l.id);
        let c = cols.get(l.id);
        if (!c) {
          const g = new THREE.Group();
          scene.add(g);
          c = { id: l.id, g, fichas: [], grises: [], x: n * sep - off, tx: n * sep - off };
          g.position.x = c.x;
          cols.set(l.id, c);
        }
        c.tx = n * sep - off;
        const quiere = Math.min(MAX, l.restantes);
        while (c.fichas.length > quiere) {
          const m = c.fichas.pop()!;
          const p = new THREE.Vector3();
          m.getWorldPosition(p);
          c.g.remove(m);
          const mat = (m.material as THREE.MeshStandardMaterial).clone();
          mat.transparent = true;
          m.material = mat;
          m.position.copy(p);
          scene.add(m);
          voladoras.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 1.2, 3.2, 1.4), t: 0, mat });
        }
        const mat = l.origen === "bienvenida" ? mats.bienvenida : l.origen === "ajuste" ? mats.ajuste : mats.compra;
        while (c.fichas.length < quiere) {
          const m = new THREE.Mesh(ficha, mat);
          const o = new THREE.Mesh(canto, mats.orilla);
          m.add(o);
          m.castShadow = true;
          m.position.y = 2.5 + c.fichas.length * 0.1;
          m.userData.cae = true;
          c.fichas.push(m);
          c.g.add(m);
        }
        c.fichas.forEach((m, i) => {
          m.material = l.siguiente && i === c!.fichas.length - 1 ? mats.siguiente : mat;
          m.userData.y = 0.04 + i * 0.082 + (c!.grises.length ? Math.min(MAX, c!.grises.length) * 0.082 : 0);
          m.userData.top = l.siguiente && i === c!.fichas.length - 1;
        });
        const grises = Math.min(MAX, l.vencidos);
        while (c.grises.length < grises) {
          const m = new THREE.Mesh(ficha, mats.vencido);
          m.position.y = 0.04 + c.grises.length * 0.082;
          c.grises.push(m);
          c.g.add(m);
        }
      });
      for (const [id, c] of cols) {
        if (!vistos.has(id)) {
          scene.remove(c.g);
          cols.delete(id);
        }
      }
      const ancho = Math.max(3, lista.length * sep + 1);
      distObjetivo = Math.max(6.4, ancho * 1.15);
    };
    let distObjetivo = 7;
    let dist = 7;
    sincronizar();
    (mount as HTMLDivElement & { __sync?: () => void }).__sync = sincronizar;

    let ptrX = 0;
    const onMove = (ev: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      ptrX = ((ev.clientX - r.left) / r.width - 0.5) * 2;
    };
    mount.addEventListener("pointermove", onMove);
    const labels = () => mount.parentElement?.querySelectorAll<HTMLElement>("[data-lote]") ?? [];
    const pv = new THREE.Vector3();

    let giro = 0;
    k.loop((dt, t) => {
      giro = damp(giro, ptrX * 0.25, 3, dt);
      dist = damp(dist, distObjetivo, 3, dt);
      camera.position.set(Math.sin(giro) * dist, 2.6, Math.cos(giro) * dist);
      camera.lookAt(0, 0.8, 0);
      for (const c of cols.values()) {
        c.x = damp(c.x, c.tx, 5, dt);
        c.g.position.x = c.x;
        c.fichas.forEach((m, i) => {
          const y = m.userData.y as number;
          m.position.y = damp(m.position.y, y + (m.userData.top && !reduce ? 0.08 + Math.sin(t * 3) * 0.05 : 0), 7 + i * 0.02, dt);
          m.rotation.y = m.userData.top ? t * 1.4 : 0;
        });
      }
      mats.siguiente.emissiveIntensity = 0.35 + Math.sin(t * 3) * 0.2;
      for (let n = voladoras.length - 1; n >= 0; n--) {
        const f = voladoras[n];
        f.t += dt;
        f.v.y -= dt * 2;
        f.m.position.addScaledVector(f.v, dt);
        f.m.rotation.x += dt * 6;
        f.mat.opacity = Math.max(0, 1 - f.t / 1.2);
        if (f.t > 1.2) {
          scene.remove(f.m);
          f.mat.dispose();
          voladoras.splice(n, 1);
        }
      }
      // etiquetas HTML bajo cada columna
      const { w } = k.size();
      labels().forEach((el) => {
        const c = cols.get(el.dataset.lote || "");
        if (!c) {
          el.style.opacity = "0";
          return;
        }
        pv.set(c.g.position.x, 0, 0).project(camera);
        el.style.opacity = "1";
        el.style.left = `${((pv.x + 1) / 2) * w}px`;
      });
      renderer.render(scene, camera);
    });

    return () => {
      mount.removeEventListener("pointermove", onMove);
      voladoras.forEach((f) => f.mat.dispose());
      k.dispose();
    };
  }, []);

  const firma = lotes.map((l) => `${l.id}:${l.restantes}:${l.vencidos}:${l.siguiente ? 1 : 0}`).join("|");
  useEffect(() => {
    const el = ref.current as (HTMLDivElement & { __sync?: () => void }) | null;
    el?.__sync?.();
  }, [firma]);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />;
}
