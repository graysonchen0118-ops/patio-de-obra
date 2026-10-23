"use client";

import Link from "next/link";
import { MapPin, Navigation, Receipt, Truck } from "lucide-react";
import type { Anuncio, Ubicacion } from "@/lib/types";
import { foto } from "@/lib/photos";
import { pesos, cantidadUnidad, haceDias } from "@/lib/format";
import { etiquetaLugar, textoDistancia } from "@/lib/geo";
import { useTilt } from "./ui";

export default function ListingCard({ a, u, km, hoy, i = 0, otroEstado }: { a: Anuncio; u: Ubicacion; km?: number; hoy: string; i?: number; otroEstado?: boolean }) {
  const ref = useTilt<HTMLAnchorElement>(6);
  return (
    <Link ref={ref} href={`/anuncio/${a.id}`} className="lc" style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }} data-anuncio={a.id}>
      <div className="lc-photo">
        <img src={foto(a.fotos[0], 640, 480)} alt={a.titulo} width={640} height={480} loading="lazy" />
        <div className="lc-shine" />
        <div className="lc-tags">
          <span className={`badge ${a.condicion === "Nuevo" ? "ok" : a.condicion === "Seminuevo" ? "sup" : ""}`}>{a.condicion}</span>
          {a.factura && (
            <span className="badge">
              <Receipt size={12} /> Factura
            </span>
          )}
          {a.flete && (
            <span className="badge">
              <Truck size={12} /> Flete
            </span>
          )}
        </div>
        {km !== undefined && (
          <div className="lc-dist">
            <Navigation size={12} /> {textoDistancia(km)}
            {otroEstado && <span style={{ opacity: 0.75, fontWeight: 700 }}>· otro estado</span>}
          </div>
        )}
      </div>
      <div className="lc-body">
        <div className="lc-title">{a.titulo}</div>
        <div className="lc-price">
          {pesos(a.precio)} <span>/ {a.unidad}</span>
        </div>
        <div className="lc-qty">Disponible: {cantidadUnidad(a.cantidad, a.unidad)}</div>
        <div className="lc-meta">
          <MapPin size={13} /> {etiquetaLugar(u)} <span style={{ marginLeft: "auto" }}>{haceDias(a.publicadoEl, hoy)}</span>
        </div>
      </div>
    </Link>
  );
}
