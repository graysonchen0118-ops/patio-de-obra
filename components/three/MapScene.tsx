"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ESTADOS_CONTORNO } from "@/lib/mexico";
import { montar, damp } from "./kit";

// México en relieve, estado por estado. El comprador es el pin oscuro; el disco es el radio
// de búsqueda y crece de 10 km a todo el país. Los anuncios dentro del radio se levantan.

export interface PinMapa {
  id: string;
  lat: number;
  lng: number;
  dentro: boolean;
}

export interface MapProps {
  centro: { lat: number; lng: number };
  estadoOrigen: string;
  radioKm: number | null;
  pins: PinMapa[];
  seleccionado?: string | null;
  onSelect?: (id: string) => void;
  alto?: number;
}

const LAT0 = 23.6;
const LNG0 = -102.3;
const K = Math.cos((LAT0 * Math.PI) / 180);
const X = (lng: number) => (lng - LNG0) * K;
const Z = (lat: number) => -(lat - LAT0);
const KM = 1 / 111.2;

export default function MapScene(props: MapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const aplicar = useRef<(() => void) | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const k = montar(mount, { dprEscritorio: 1.25, ambiente: false });
    if (!k) return;
    const { scene, renderer, track, reduce } = k;
    
    const camera = new THREE.PerspectiveCamera(38, k.size().w / k.size().h, 0.01, 200);
    k.onResize((w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      aplicar.current?.();
    });
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4c6, 1.0));
    const sol = new THREE.DirectionalLight(0xfff3e2, 1.6);
    sol.position.set(-6, 14, 8);
    scene.add(sol);

    const mar = new THREE.Mesh(track(new THREE.PlaneGeometry(160, 160)), new THREE.MeshBasicMaterial({ color: 0xd3e2e5 }));
    mar.rotation.x = -Math.PI / 2;
    mar.position.y = -0.02;
    scene.add(mar);

    // estados
    const estados: { nombre: string; mat: THREE.MeshLambertMaterial }[] = [];
    const bordes: THREE.Vector3[] = [];
    const ALTO = 0.07;
    for (const e of ESTADOS_CONTORNO) {
      const formas = e.r.map((ring) => {
        const s = new THREE.Shape();
        ring.forEach(([lng, lat], n) => {
          const x = X(lng);
          const y = lat - LAT0;
          if (n === 0) s.moveTo(x, y);
          else s.lineTo(x, y);
        });
        for (let n = 0; n < ring.length; n++) {
          const [a1, b1] = ring[n];
          const [a2, b2] = ring[(n + 1) % ring.length];
          bordes.push(new THREE.Vector3(X(a1), ALTO + 0.004, Z(b1)), new THREE.Vector3(X(a2), ALTO + 0.004, Z(b2)));
        }
        return s;
      });
      const geo = track(new THREE.ExtrudeGeometry(formas, { depth: ALTO, bevelEnabled: false, curveSegments: 1 }));
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshLambertMaterial({ color: 0xf6f1e9 });
      const m = new THREE.Mesh(geo, mat);
      scene.add(m);
      estados.push({ nombre: e.n, mat });
    }
    const lineas = new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(bordes)), new THREE.LineBasicMaterial({ color: 0xb4a999, transparent: true, opacity: 0.9 }));
    scene.add(lineas);

    // disco de radio
    const disco = new THREE.Mesh(track(new THREE.CircleGeometry(1, 128).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ color: 0xb5452b, transparent: true, opacity: 0.14, depthWrite: false }));
    const borde = new THREE.Mesh(track(new THREE.RingGeometry(0.985, 1, 160).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ color: 0xb5452b, transparent: true, opacity: 0.9, depthWrite: false }));
    disco.position.y = borde.position.y = ALTO + 0.006;
    scene.add(disco, borde);
    const onda = new THREE.Mesh(track(new THREE.RingGeometry(0.97, 1, 128).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ color: 0x1e3c49, transparent: true, opacity: 0.6, depthWrite: false }));
    onda.position.y = ALTO + 0.008;
    scene.add(onda);

    // comprador
    const yo = new THREE.Group();
    const yoMat = new THREE.MeshLambertMaterial({ color: 0x1e3c49 });
    const cono = new THREE.Mesh(track(new THREE.ConeGeometry(0.35, 1, 24).rotateX(Math.PI).translate(0, 0.5, 0)), yoMat);
    const bola = new THREE.Mesh(track(new THREE.SphereGeometry(0.42, 24, 16).translate(0, 1.15, 0)), yoMat);
    yo.add(cono, bola);
    scene.add(yo);

    // pines de anuncios: un solo InstancedMesh, el color dice si cae dentro del radio
    const pinGeo = track(mergeGeometries([new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8).translate(0, 0.45, 0), new THREE.SphereGeometry(0.3, 18, 12).translate(0, 1.05, 0)]));
    const pinMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    let pines: THREE.InstancedMesh | null = null;
    let estadoPines: { id: string; x: number; z: number; dentro: boolean; s: number; h: number }[] = [];
    const cDentro = new THREE.Color(0xb5452b);
    const cFuera = new THREE.Color(0x97a2a8);
    const cSel = new THREE.Color(0x1e3c49);
    const tmp = new THREE.Color();

    const objetivo = { x: 0, z: 0, d: 30, r: 0.3 };
    const actual = { x: 0, z: 0, d: 34, r: 0.01 };

    aplicar.current = () => {
      const p = propsRef.current;
      const cx = X(p.centro.lng);
      const cz = Z(p.centro.lat);
      yo.position.set(cx, ALTO, cz);
      const r = p.radioKm === null ? null : p.radioKm * KM;
      objetivo.r = r ?? 0;
      if (r === null) {
        objetivo.x = 0.6;
        objetivo.z = 0.4;
        objetivo.d = Math.min(30, Math.max(12.5, 36 / Math.max(0.5, camera.aspect)));
      } else {
        objetivo.x = cx;
        objetivo.z = cz;
        objetivo.d = Math.max(r * 3.6, 0.5);
      }
      estados.forEach((e) => e.mat.color.set(e.nombre === p.estadoOrigen ? 0xe3edf0 : 0xf6f1e9));
      if (!pines || pines.count !== p.pins.length) {
        if (pines) {
          scene.remove(pines);
          pines.dispose();
        }
        pines = new THREE.InstancedMesh(pinGeo, pinMat, Math.max(1, p.pins.length));
        pines.count = p.pins.length;
        pines.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(pines);
        estadoPines = p.pins.map((x) => ({ id: x.id, x: X(x.lng), z: Z(x.lat), dentro: x.dentro, s: 0, h: 0 }));
      } else {
        estadoPines = p.pins.map((x, n) => ({ id: x.id, x: X(x.lng), z: Z(x.lat), dentro: x.dentro, s: estadoPines[n]?.s ?? 0, h: estadoPines[n]?.h ?? 0 }));
      }
      onda.scale.setScalar(0.001);
      ondaT = 0;
    };
    let ondaT = 2;
    aplicar.current();
    actual.x = objetivo.x;
    actual.z = objetivo.z;

    // ratón: inclina un poco la vista y elige pines
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let sobre = -1;
    const ptr = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ptr.x = ndc.x;
      ptr.y = ndc.y;
      if (!pines) return;
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(pines)[0];
      sobre = hit?.instanceId ?? -1;
      renderer.domElement.style.cursor = sobre >= 0 ? "pointer" : "default";
    };
    const onClick = () => {
      if (sobre >= 0 && estadoPines[sobre]) propsRef.current.onSelect?.(estadoPines[sobre].id);
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("click", onClick);

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const mira = new THREE.Vector3();
    k.loop((dt, t) => {
      actual.x = damp(actual.x, objetivo.x, 2.6, dt);
      actual.z = damp(actual.z, objetivo.z, 2.6, dt);
      actual.d = damp(actual.d, objetivo.d, 2.2, dt);
      actual.r = damp(actual.r, objetivo.r, 3, dt);
      const inclina = reduce ? 0 : ptr.x * 0.08;
      camera.position.set(actual.x + Math.sin(inclina) * actual.d * 0.75, actual.d * 0.98 + ptr.y * actual.d * 0.05, actual.z + Math.cos(inclina) * actual.d * 0.72);
      mira.set(actual.x, 0, actual.z - actual.d * 0.04);
      camera.lookAt(mira);

      const verDisco = objetivo.r > 0;
      disco.visible = borde.visible = actual.r > 0.002 && (verDisco || actual.r > 0.01);
      disco.position.x = borde.position.x = yo.position.x;
      disco.position.z = borde.position.z = yo.position.z;
      disco.scale.setScalar(Math.max(actual.r, 0.0001));
      borde.scale.setScalar(Math.max(actual.r, 0.0001));
      (disco.material as THREE.MeshBasicMaterial).opacity = verDisco ? 0.14 : damp((disco.material as THREE.MeshBasicMaterial).opacity, 0, 4, dt);
      (borde.material as THREE.MeshBasicMaterial).opacity = verDisco ? 0.9 : damp((borde.material as THREE.MeshBasicMaterial).opacity, 0, 4, dt);

      // onda que recorre el radio nuevo
      ondaT += dt;
      const alcance = verDisco ? objetivo.r : 14;
      onda.position.x = yo.position.x;
      onda.position.z = yo.position.z;
      onda.scale.setScalar(Math.max(0.001, Math.min(1, ondaT / 1.2)) * alcance);
      (onda.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - ondaT * 0.55);

      const escala = actual.d * 0.024;
      yo.scale.setScalar(escala * (1 + (reduce ? 0 : Math.sin(t * 3) * 0.05)));

      if (pines) {
        const sel = propsRef.current.seleccionado;
        estadoPines.forEach((p, n) => {
          const meta = p.dentro ? 1 : 0.55;
          p.s = damp(p.s, meta, 5, dt);
          p.h = damp(p.h, p.dentro ? 1 : 0.6, 4, dt);
          const marcado = sel === p.id || n === sobre;
          const e = escala * p.s * (marcado ? 1.4 : 1);
          q.identity();
          sc.set(e, e * p.h, e);
          m4.compose(v.set(p.x, ALTO, p.z), q, sc);
          pines!.setMatrixAt(n, m4);
          tmp.copy(marcado ? cSel : p.dentro ? cDentro : cFuera);
          pines!.setColorAt(n, tmp);
        });
        pines.instanceMatrix.needsUpdate = true;
        if (pines.instanceColor) pines.instanceColor.needsUpdate = true;
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("click", onClick);
      if (pines) pines.dispose();
      aplicar.current = null;
      k.dispose();
    };
  }, []);

  const firma = `${props.centro.lat},${props.centro.lng},${props.radioKm},${props.estadoOrigen},${props.pins.map((p) => p.id + (p.dentro ? 1 : 0)).join("")}`;
  useEffect(() => {
    aplicar.current?.();
  }, [firma]);

  return <div ref={ref} className="map-scene" style={props.alto ? { height: props.alto } : undefined} aria-hidden="true" />;
}
