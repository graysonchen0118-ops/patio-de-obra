"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { montar, damp, sombraSuave, acento } from "./kit";

// La casa con varillas de espera: la planta baja es la primera etapa, terminada.
// Cada función de la segunda etapa que se enciende levanta un cuarto del segundo piso
// sobre las varillas que ya estaban, sin tocar lo de abajo.

const CUARTOS = [
  { x: -1, z: -0.75, cols: [0, 4] },
  { x: 1, z: -0.75, cols: [4, 1] },
  { x: -1, z: 0.75, cols: [2, 5] },
  { x: 1, z: 0.75, cols: [5, 3] },
];
const COLUMNAS: [number, number][] = [
  [-2, -1.5],
  [2, -1.5],
  [-2, 1.5],
  [2, 1.5],
  [0, -1.5],
  [0, 1.5],
];

export default function EtapasScene({ encendidos }: { encendidos: boolean[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const estado = useRef(encendidos);
  estado.current = encendidos;

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dprEscritorio: 1.5, ambiente: false });
    if (!k) return;
    const { scene, renderer, track, reduce } = k;
    const camera = new THREE.PerspectiveCamera(32, k.size().w / k.size().h, 0.1, 80);
    k.onResize((w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb4a690, 1.1));
    const sol = new THREE.DirectionalLight(0xfff0da, 1.8);
    sol.position.set(5, 9, 6);
    scene.add(sol);

    const casa = new THREE.Group();
    scene.add(casa);
    const sombra = sombraSuave(7.5, 6, 0.35);
    sombra.position.y = 0.01;
    casa.add(sombra);

    const losa = new THREE.Mesh(track(new THREE.BoxGeometry(5.2, 0.16, 4.2)), new THREE.MeshLambertMaterial({ color: 0xc9c1b4 }));
    losa.position.y = 0.08;
    casa.add(losa);

    // planta baja: aplanado, ventanas y puerta
    const muro = new THREE.MeshLambertMaterial({ color: 0xeee2d2 });
    const pb = new THREE.Mesh(track(new THREE.BoxGeometry(4, 1.3, 3)), muro);
    pb.position.y = 0.16 + 0.65;
    casa.add(pb);
    const vidrio = new THREE.MeshLambertMaterial({ color: 0x2b3a42 });
    const ventana = track(new THREE.PlaneGeometry(0.62, 0.5));
    for (const x of [-1.2, 0.2, 1.2]) {
      const v = new THREE.Mesh(ventana, vidrio);
      v.position.set(x, 0.95, 1.501);
      casa.add(v);
    }
    const puerta = new THREE.Mesh(track(new THREE.PlaneGeometry(0.5, 0.9)), new THREE.MeshLambertMaterial({ color: 0x8a5a36 }));
    puerta.position.set(-0.45, 0.61, 1.502);
    casa.add(puerta);
    for (const z of [-0.6, 0.6]) {
      const v = new THREE.Mesh(ventana, vidrio);
      v.rotation.y = Math.PI / 2;
      v.position.set(2.001, 0.95, z);
      casa.add(v);
    }
    const azotea = new THREE.Mesh(track(new THREE.BoxGeometry(4.2, 0.14, 3.2)), new THREE.MeshLambertMaterial({ color: 0xb8b0a3 }));
    azotea.position.y = 1.53;
    casa.add(azotea);

    // varillas de espera en cada castillo
    const varilla = track(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 6));
    const oxido = new THREE.MeshPhongMaterial({ color: 0x7a4a2c, shininess: 40 });
    const grupos = COLUMNAS.map(([x, z]) => {
      const g = new THREE.Group();
      for (const [dx, dz] of [
        [-0.05, -0.05],
        [0.05, -0.05],
        [-0.05, 0.05],
        [0.05, 0.05],
      ]) {
        const m = new THREE.Mesh(varilla, oxido);
        m.position.set(dx, 0.35, dz);
        m.rotation.z = dx * 0.6;
        g.add(m);
      }
      g.position.set(x * 0.98, 1.6, z * 0.98);
      casa.add(g);
      return { g, s: 1 };
    });

    // segundo piso: un cuarto por función
    const cuartoGeo = track(new THREE.BoxGeometry(1.96, 1.1, 1.46));
    const franjaGeo = track(new THREE.BoxGeometry(1.98, 0.08, 1.48));
    const franjaMat = new THREE.MeshLambertMaterial({ color: acento() });
    const tonos = [0xf3e8d9, 0xede0cf, 0xf0e4d4, 0xe9dac8];
    const cuartos = CUARTOS.map((c, i) => {
      const g = new THREE.Group();
      const cuerpo = new THREE.Mesh(cuartoGeo, new THREE.MeshLambertMaterial({ color: tonos[i] }));
      cuerpo.position.y = 0.55;
      g.add(cuerpo);
      const franja = new THREE.Mesh(franjaGeo, franjaMat);
      franja.position.y = 1.12;
      g.add(franja);
      const v = new THREE.Mesh(ventana, vidrio);
      v.position.set(0, 0.6, c.z > 0 ? 0.731 : -0.731);
      if (c.z < 0) v.rotation.y = Math.PI;
      g.add(v);
      g.position.set(c.x, 1.6, c.z);
      g.scale.set(1, 0.001, 1);
      g.visible = false;
      casa.add(g);
      return { g, h: 0 };
    });

    const onMarca = (e: Event) => {
      if ((e as CustomEvent).detail === "marca") franjaMat.color.copy(acento());
    };
    window.addEventListener("patio:pulso", onMarca);

    let ptrX = 0;
    const onMove = (ev: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      ptrX = ((ev.clientX - r.left) / r.width - 0.5) * 2;
    };
    mount.addEventListener("pointermove", onMove);
    let giro = 0;

    k.loop((dt, t) => {
      giro = damp(giro, ptrX * 0.35, 3, dt);
      const ang = 0.7 + giro + (reduce ? 0 : Math.sin(t * 0.25) * 0.15);
      camera.position.set(Math.sin(ang) * 9, 5.4, Math.cos(ang) * 9);
      camera.lookAt(0, 1.3, 0);
      const on = estado.current;
      cuartos.forEach((c, i) => {
        c.h = damp(c.h, on[i] ? 1 : 0, 4, dt);
        c.g.visible = c.h > 0.01;
        c.g.scale.set(1, Math.max(0.001, c.h), 1);
        c.g.position.y = 1.6 + (1 - c.h) * 0.6;
      });
      grupos.forEach((gr, ci) => {
        const tapada = CUARTOS.some((c, i) => on[i] && c.cols.includes(ci));
        gr.s = damp(gr.s, tapada ? 0 : 1, 5, dt);
        gr.g.scale.set(1, Math.max(0.001, gr.s), 1);
        gr.g.visible = gr.s > 0.02;
      });
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("patio:pulso", onMarca);
      mount.removeEventListener("pointermove", onMove);
      k.dispose();
    };
  }, []);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />;
}
