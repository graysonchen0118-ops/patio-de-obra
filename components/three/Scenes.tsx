"use client";

import dynamic from "next/dynamic";

export const Backdrop = dynamic(() => import("./Backdrop"), {
  ssr: false,
  loading: () => <div className="bg-fallback" aria-hidden="true" />,
});

export const Yard = dynamic(() => import("./YardScene"), {
  ssr: false,
  loading: () => (
    <div
      className="hero-scene"
      aria-hidden="true"
      style={{ background: "radial-gradient(520px 320px at 72% 55%, rgba(214,106,60,0.18), transparent 65%), radial-gradient(420px 260px at 60% 85%, rgba(30,60,73,0.12), transparent 60%)" }}
    />
  ),
});

export const Mapa = dynamic(() => import("./MapScene"), {
  ssr: false,
  loading: () => <div className="map-scene skel" aria-hidden="true" />,
});

export const Pila = dynamic(() => import("./StackScene"), {
  ssr: false,
  loading: () => <div className="skel" style={{ position: "absolute", inset: 0 }} aria-hidden="true" />,
});

export const Fichas = dynamic(() => import("./CreditScene"), {
  ssr: false,
  loading: () => <div className="skel" style={{ position: "absolute", inset: 0 }} aria-hidden="true" />,
});

export const Etapas = dynamic(() => import("./EtapasScene"), {
  ssr: false,
  loading: () => <div className="skel" style={{ position: "absolute", inset: 0 }} aria-hidden="true" />,
});
