"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { montar, damp, sombraSuave } from "./kit";

// El patio detrás de una obra: tarimas de cemento, block, varilla, triplay, tubo y una
// revolvedora. Un anillo de búsqueda sale del centro y cada material se enciende cuando
// el anillo lo alcanza: así se ve "buscar por distancia" sin una palabra.

const C = {
  piso: 0xd6cdbf,
  losa: 0xcbc3b6,
  madera: 0x9e7349,
  saco: 0xc9a46c,
  sacoBanda: 0x8c331f,
  block: 0xa7a299,
  varilla: 0x7a4a2c,
  triplay: 0xd8b886,
  tubo: 0xd66a3c,
  olla: 0xd06135,
  metal: 0x39444b,
  hule: 0x23282c,
  acento: 0xb5452b,
  sup: 0x1e3c49,
};

function tarima(g: THREE.Group, x: number, z: number, w: number, d: number, mat: THREE.Material, track: <T extends { dispose: () => void }>(x: T) => T) {
  const tabla = track(new THREE.BoxGeometry(w, 0.035, d / 6));
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(tabla, mat);
    m.position.set(x, 0.135, z - d / 2 + d / 10 + (i * d) / 5.6);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  }
  const taco = track(new THREE.BoxGeometry(w, 0.1, 0.12));
  for (const dz of [-d / 2 + 0.08, 0, d / 2 - 0.08]) {
    const m = new THREE.Mesh(taco, mat);
    m.position.set(x, 0.065, z + dz);
    m.castShadow = true;
    g.add(m);
  }
}

export default function YardScene() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dprEscritorio: 1.5, ambiente: false });
    if (!k) return;
    const { scene, renderer, track, small, reduce } = k;
        scene.fog = new THREE.Fog(0xe8e0d5, 20, 44);

    const camera = new THREE.PerspectiveCamera(34, k.size().w / k.size().h, 0.1, 120);
    // en pantallas anchas el patio se corre a la derecha y deja el texto limpio
    const encuadre = (w: number, h: number) => {
      camera.aspect = w / h;
      if (w / h > 1.25) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    encuadre(k.size().w, k.size().h);
    k.onResize(encuadre);

    // luz
    scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb4a690, 0.75));
    const sol = new THREE.DirectionalLight(0xfff0da, 2.4);
    sol.position.set(7, 11, 5);
    scene.add(sol);

    const patio = new THREE.Group();
    scene.add(patio);

    // el patio es una losa suelta sobre el fondo, como una maqueta: sin piso infinito
    const piso = sombraSuave(17, 13.5, 0.32);
    piso.position.y = -0.3;
    patio.add(piso);
    const losa = new THREE.Mesh(track(new THREE.BoxGeometry(13, 0.4, 9.5)), new THREE.MeshLambertMaterial({ color: C.losa }));
    losa.position.y = -0.1;
    losa.receiveShadow = true;
    patio.add(losa);
    const juntas = new THREE.LineSegments(
      track(
        new THREE.BufferGeometry().setFromPoints(
          [-4.3, -1.1, 2.1].flatMap((x) => [new THREE.Vector3(x, 0.101, -4.75), new THREE.Vector3(x, 0.101, 4.75)]).concat([-1.6, 1.6].flatMap((z) => [new THREE.Vector3(-6.5, 0.101, z), new THREE.Vector3(6.5, 0.101, z)])),
        ),
      ),
      new THREE.LineBasicMaterial({ color: 0xb3aa9c, transparent: true, opacity: 0.7 }),
    );
    patio.add(juntas);

    const madera = new THREE.MeshLambertMaterial({ color: C.madera });
    const base = new THREE.Group();
    base.position.y = 0.1;
    patio.add(base);
    for (const [x, z, w, d, o] of [
      [-3.4, 1.4, 2.1, 1.8, 0.42],
      [-0.7, -1.9, 1.9, 1.7, 0.42],
      [2.5, 1.9, 5.6, 1.5, 0.3],
      [3.4, -1.7, 3.2, 2.0, 0.38],
      [0.4, 2.75, 3.6, 1.3, 0.3],
      [-3.7, -2.2, 1.9, 1.9, 0.4],
    ]) {
      const s = sombraSuave(w, d, o);
      s.position.set(x + 0.18, 0.006, z + 0.12);
      base.add(s);
    }

    // ---- cemento en tarima ----
    tarima(base, -3.4, 1.4, 1.5, 1.2, madera, track);
    const saco = track(new RoundedBoxGeometry(0.66, 0.17, 0.46, 3, 0.07));
    const sacos = new THREE.InstancedMesh(saco, new THREE.MeshLambertMaterial({ color: C.saco }), small ? 12 : 16);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s1 = new THREE.Vector3(1, 1, 1);
    let i = 0;
    for (let capa = 0; capa < (small ? 3 : 4); capa++) {
      for (let j = 0; j < 4; j++) {
        const giro = capa % 2 === 0;
        const px = giro ? -3.4 + (j % 2 === 0 ? -0.34 : 0.34) : -3.4 + (j < 2 ? -0.24 : 0.24);
        const pz = giro ? 1.4 + (j < 2 ? -0.24 : 0.24) : 1.4 + (j % 2 === 0 ? -0.34 : 0.34);
        q.setFromEuler(new THREE.Euler(0, giro ? 0.02 * j : Math.PI / 2 + 0.03 * j, 0));
        m4.compose(v.set(px, 0.24 + capa * 0.17, pz), q, s1);
        sacos.setMatrixAt(i++, m4);
      }
    }
    sacos.castShadow = sacos.receiveShadow = true;
    base.add(sacos);

    // ---- block ----
    tarima(base, -0.7, -1.9, 1.3, 1.1, madera, track);
    const blockG = track(new THREE.BoxGeometry(0.38, 0.19, 0.19));
    const nx = 3,
      nz = 5,
      ny = small ? 4 : 6;
    const blocks = new THREE.InstancedMesh(blockG, new THREE.MeshLambertMaterial({ color: C.block }), nx * nz * ny);
    i = 0;
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++)
        for (let z = 0; z < nz; z++) {
          m4.compose(v.set(-0.7 + (x - 1) * 0.4, 0.25 + y * 0.2, -1.9 + (z - 2) * 0.2), q.identity(), s1);
          blocks.setMatrixAt(i++, m4);
        }
    blocks.castShadow = blocks.receiveShadow = true;
    base.add(blocks);

    // ---- varilla sobre durmientes ----
    const durm = track(new THREE.BoxGeometry(0.16, 0.14, 1.1));
    for (const dx of [-1.5, 0, 1.5]) {
      const m = new THREE.Mesh(durm, madera);
      m.position.set(2.5 + dx, 0.07, 1.9);
      m.castShadow = true;
      base.add(m);
    }
    const barra = track(new THREE.CylinderGeometry(0.028, 0.028, 4.8, 6));
    barra.rotateZ(Math.PI / 2);
    const nV = small ? 18 : 30;
    const varillas = new THREE.InstancedMesh(barra, new THREE.MeshPhongMaterial({ color: C.varilla, shininess: 60, specular: 0x553322 }), nV);
    for (let n = 0; n < nV; n++) {
      const fila = Math.floor(n / 8);
      const col = n % 8;
      m4.compose(v.set(2.5 + (Math.random() - 0.5) * 0.12, 0.17 + fila * 0.052, 1.9 - 0.2 + col * 0.058 + (fila % 2) * 0.029), q.identity(), s1);
      varillas.setMatrixAt(n, m4);
    }
    varillas.castShadow = true;
    base.add(varillas);

    // ---- triplay ----
    tarima(base, 3.4, -1.7, 2.5, 1.3, madera, track);
    const hoja = track(new THREE.BoxGeometry(2.44, 0.03, 1.22));
    const nH = small ? 10 : 16;
    const hojas = new THREE.InstancedMesh(hoja, new THREE.MeshLambertMaterial({ color: C.triplay }), nH);
    for (let n = 0; n < nH; n++) {
      q.setFromEuler(new THREE.Euler(0, (Math.random() - 0.5) * 0.03, 0));
      m4.compose(v.set(3.4 + (Math.random() - 0.5) * 0.05, 0.17 + n * 0.031, -1.7 + (Math.random() - 0.5) * 0.04), q, s1);
      hojas.setMatrixAt(n, m4);
    }
    hojas.castShadow = hojas.receiveShadow = true;
    base.add(hojas);

    // ---- tubo de PVC en pirámide ----
    const tuboG = track(new THREE.CylinderGeometry(0.085, 0.085, 3, 18, 1, true));
    tuboG.rotateZ(Math.PI / 2);
    const tubos = new THREE.InstancedMesh(tuboG, new THREE.MeshLambertMaterial({ color: C.tubo, side: THREE.DoubleSide }), 10);
    i = 0;
    for (let fila = 0; fila < 4; fila++)
      for (let c = 0; c < 4 - fila; c++) {
        m4.compose(v.set(0.4, 0.085 + fila * 0.148, 2.75 + (c - (3 - fila) / 2) * 0.172), q.identity(), s1);
        tubos.setMatrixAt(i++, m4);
      }
    tubos.castShadow = true;
    base.add(tubos);

    // ---- revolvedora ----
    const rev = new THREE.Group();
    rev.position.set(-3.7, 0, -2.2);
    rev.rotation.y = 0.7;
    base.add(rev);
    const perfil = [
      [0.02, -0.55],
      [0.36, -0.5],
      [0.5, -0.25],
      [0.52, 0.05],
      [0.42, 0.32],
      [0.25, 0.5],
      [0.22, 0.56],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const olla = new THREE.Mesh(track(new THREE.LatheGeometry(perfil, 28)), new THREE.MeshPhongMaterial({ color: C.olla, shininess: 50, specular: 0x444444, side: THREE.DoubleSide }));
    olla.position.set(0, 0.95, 0);
    olla.rotation.z = -0.62;
    olla.castShadow = true;
    rev.add(olla);
    const metal = new THREE.MeshPhongMaterial({ color: C.metal, shininess: 40 });
    const pata = track(new THREE.BoxGeometry(0.07, 0.9, 0.07));
    for (const [x, z, r] of [
      [-0.35, 0.3, 0.25],
      [-0.35, -0.3, 0.25],
      [0.4, 0, -0.2],
    ]) {
      const m = new THREE.Mesh(pata, metal);
      m.position.set(x, 0.45, z);
      m.rotation.z = r;
      m.castShadow = true;
      rev.add(m);
    }
    const llanta = track(new THREE.TorusGeometry(0.2, 0.07, 10, 22));
    for (const z of [-0.42, 0.42]) {
      const m = new THREE.Mesh(llanta, new THREE.MeshLambertMaterial({ color: C.hule }));
      m.position.set(-0.45, 0.22, z);
      m.castShadow = true;
      rev.add(m);
    }
    const motor = new THREE.Mesh(track(new THREE.BoxGeometry(0.34, 0.26, 0.3)), new THREE.MeshLambertMaterial({ color: 0x2c5566 }));
    motor.position.set(0.35, 0.55, 0.32);
    motor.castShadow = true;
    rev.add(motor);

    // ---- pines y anillo de búsqueda ----
    const puntos = [
      new THREE.Vector3(-3.4, 1.15, 1.4),
      new THREE.Vector3(-0.7, 1.75, -1.9),
      new THREE.Vector3(2.5, 0.9, 1.9),
      new THREE.Vector3(3.4, 1.1, -1.7),
      new THREE.Vector3(0.4, 1.1, 2.75),
      new THREE.Vector3(-3.7, 1.9, -2.2),
    ];
    const pinGeo = track(new THREE.ConeGeometry(0.12, 0.32, 20));
    pinGeo.rotateX(Math.PI);
    const cabeza = track(new THREE.SphereGeometry(0.15, 24, 16));
    const pines = puntos.map((p, n) => {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({ color: n % 2 ? C.sup : C.acento, emissive: C.acento, emissiveIntensity: 0 });
      const c = new THREE.Mesh(pinGeo, mat);
      const h = new THREE.Mesh(cabeza, mat);
      h.position.y = 0.2;
      g.add(c, h);
      g.position.copy(p);
      base.add(g);
      return { g, mat, base: p.clone(), brillo: 0, dist: Math.hypot(p.x, p.z) };
    });

    const anilloGeo = track(new THREE.RingGeometry(0.96, 1, 96));
    anilloGeo.rotateX(-Math.PI / 2);
    const discoGeo = track(new THREE.CircleGeometry(1, 96));
    discoGeo.rotateX(-Math.PI / 2);
    type Onda = { r: THREE.Mesh; d: THREE.Mesh; mr: THREE.MeshBasicMaterial; md: THREE.MeshBasicMaterial; t: number };
    const ondas: Onda[] = [];
    const lanzar = () => {
      const mr = new THREE.MeshBasicMaterial({ color: C.acento, transparent: true, opacity: 0.85, depthWrite: false });
      const md = new THREE.MeshBasicMaterial({ color: C.acento, transparent: true, opacity: 0.08, depthWrite: false });
      const r = new THREE.Mesh(anilloGeo, mr);
      const d = new THREE.Mesh(discoGeo, md);
      r.position.y = d.position.y = 0.115;
      base.add(r, d);
      ondas.push({ r, d, mr, md, t: 0 });
    };
    lanzar();
    let cada = 0;
    const onPulso = () => lanzar();
    window.addEventListener("patio:pulso", onPulso);

    // ---- cámara con ratón y rolado ----
    const ptr = { x: 0, y: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const loQueMira = new THREE.Vector3();
    k.loop((dt, t) => {
      const ancho = camera.aspect > 1.25;
      cur.x = damp(cur.x, ptr.x, 2.5, dt);
      cur.y = damp(cur.y, ptr.y, 2.5, dt);
      cur.s = damp(cur.s, Math.min(window.scrollY, 900), 4, dt);
      const giro = (reduce ? 0 : Math.sin(t * 0.12) * 0.16) + cur.x * 0.12;
      const dist = (ancho ? 15.5 : 15) + cur.s * 0.006;
      const alto = 7.2 + cur.s * 0.006 - cur.y * 0.6;
      camera.position.set(Math.sin(0.55 + giro) * dist, alto, Math.cos(0.55 + giro) * dist);
      loQueMira.set(0, 0.9 - cur.s * 0.0015, 0.2);
      camera.lookAt(loQueMira);

      if (!reduce) {
        cada += dt;
        if (cada > 3.6) {
          cada = 0;
          lanzar();
        }
      }
      for (let n = ondas.length - 1; n >= 0; n--) {
        const o = ondas[n];
        o.t += dt;
        const r = 0.4 + o.t * 2.2;
        o.r.scale.setScalar(r);
        o.d.scale.setScalar(r);
        const vida = Math.max(0, 1 - o.t / 3.4);
        o.mr.opacity = 0.85 * vida;
        o.md.opacity = 0.08 * vida;
        pines.forEach((p) => {
          if (Math.abs(p.dist - r) < 0.15) p.brillo = 1;
        });
        if (o.t > 3.4) {
          base.remove(o.r, o.d);
          o.mr.dispose();
          o.md.dispose();
          ondas.splice(n, 1);
        }
      }
      pines.forEach((p, n) => {
        p.brillo = Math.max(0, p.brillo - dt * 1.3);
        p.mat.emissiveIntensity = p.brillo * 0.9;
        const s = 1 + p.brillo * 0.45;
        p.g.scale.setScalar(s);
        p.g.position.y = p.base.y + (reduce ? 0 : Math.sin(t * 1.6 + n) * 0.06) + p.brillo * 0.15;
        p.g.rotation.y = t * 0.6 + n;
      });
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("patio:pulso", onPulso);
      window.removeEventListener("pointermove", onMove);
      ondas.forEach((o) => {
        o.mr.dispose();
        o.md.dispose();
      });
      k.dispose();
    };
  }, []);

  return <div ref={ref} className="hero-scene" aria-hidden="true" />;
}
