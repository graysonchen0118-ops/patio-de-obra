"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { montar, damp } from "./kit";

// Fondo de todo el sitio: block, varilla y hojas de triplay flotando en la neblina, en
// capas que se mueven a distinta velocidad con el rolado y el ratón.

export default function Backdrop() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dprEscritorio: 0.9, ambiente: true });
    if (!k) return;
    const { scene, renderer, track, small, reduce } = k;
    renderer.setPixelRatio(small ? 1 : 0.9);
    scene.environmentIntensity = 0.5;
    scene.fog = new THREE.Fog(0xf3efe9, 10, 34);
    const camera = new THREE.PerspectiveCamera(48, k.size().w / k.size().h, 0.1, 80);
    camera.position.set(0, 0, 16);
    k.onResize((w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd2c6b4, 1.1));
    const sol = new THREE.DirectionalLight(0xfff1de, 1.4);
    sol.position.set(4, 8, 6);
    scene.add(sol);

    let seed = 11;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    type Pieza = { base: THREE.Vector3; rot: THREE.Euler; giro: THREE.Vector3; capa: number };
    const capas = [
      { n: small ? 10 : 18, geo: track(new THREE.BoxGeometry(0.8, 0.4, 0.4)), mat: new THREE.MeshStandardMaterial({ color: 0xbdb6ab, roughness: 0.95, transparent: true, opacity: 0.55 }) },
      { n: small ? 8 : 14, geo: track(new THREE.CylinderGeometry(0.035, 0.035, 5, 6)), mat: new THREE.MeshStandardMaterial({ color: 0x9a6a4c, roughness: 0.5, metalness: 0.5, transparent: true, opacity: 0.45 }) },
      { n: small ? 5 : 9, geo: track(new THREE.BoxGeometry(2.4, 0.04, 1.2)), mat: new THREE.MeshStandardMaterial({ color: 0xdcc39b, roughness: 0.85, transparent: true, opacity: 0.4 }) },
    ];
    const grupos = capas.map((c, ci) => {
      const mesh = new THREE.InstancedMesh(c.geo, track(c.mat), c.n);
      const piezas: Pieza[] = [];
      for (let i = 0; i < c.n; i++) {
        piezas.push({
          base: new THREE.Vector3((rnd() - 0.5) * 40, (rnd() - 0.5) * 30, -4 - rnd() * 22 - ci * 2),
          rot: new THREE.Euler(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI),
          giro: new THREE.Vector3((rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.08),
          capa: ci,
        });
      }
      scene.add(mesh);
      return { mesh, piezas };
    });

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    const ptr = { x: 0, y: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    let empuje = 0;
    const onPulso = () => (empuje = 1);
    window.addEventListener("patio:pulso", onPulso);

    k.loop((dt, t) => {
      cur.x = damp(cur.x, ptr.x, 2, dt);
      cur.y = damp(cur.y, ptr.y, 2, dt);
      cur.s = damp(cur.s, window.scrollY, 5, dt);
      empuje = Math.max(0, empuje - dt * 0.8);
      camera.position.x = cur.x * 1.4;
      camera.position.y = -cur.y * 0.9 - cur.s * 0.004;
      camera.position.z = 16 - empuje * 2.5;
      camera.lookAt(0, camera.position.y * 0.7, 0);
      grupos.forEach(({ mesh, piezas }) => {
        piezas.forEach((p, i) => {
          const vel = 0.003 * (1 + (p.base.z + 30) / 18);
          const flota = reduce ? 0 : Math.sin(t * 0.25 + i) * 0.4;
          v.set(p.base.x, p.base.y + flota + cur.s * vel, p.base.z);
          if (!reduce) {
            p.rot.x += p.giro.x * dt;
            p.rot.y += p.giro.y * dt;
            p.rot.z += p.giro.z * dt;
          }
          q.setFromEuler(p.rot);
          m4.compose(v, q, s);
          mesh.setMatrixAt(i, m4);
        });
        mesh.instanceMatrix.needsUpdate = true;
      });
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("patio:pulso", onPulso);
      k.dispose();
    };
  }, []);

  return <div ref={ref} className="bg-canvas" aria-hidden="true" />;
}
