"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Star, Sparkles, ArrowLeft, BadgeCheck, CalendarDays, Eye, Flag, MapPin, MessageCircle, Navigation, PackageCheck, Receipt, Truck, Clock3, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { cercanos, visible, extrasTarjeta, promedio, destacadoActivo } from "@/lib/engine";
import { distanciaKm, etiquetaLugar, textoDistancia, ubicacion } from "@/lib/geo";
import { foto } from "@/lib/photos";
import { cantidadUnidad, fechaCorta, fechaLarga, faltan, pesos, numero, enmascararTel } from "@/lib/format";
import { Avatar, Empty, Modal, Skel, Spin, useTilt } from "@/components/ui";
import ListingCard from "@/components/ListingCard";
import WhatsAppModal from "@/components/WhatsAppModal";
import { Pila } from "@/components/three/Scenes";
import { tipoPila } from "@/components/three/StackScene";

const MOTIVOS = ["Ya se vendió y sigue publicado", "El precio o la cantidad no corresponde", "Las fotos no son del material", "Parece fraude o pide anticipo"];

export default function AnuncioPage() {
  const { id } = useParams<{ id: string }>();
  const { db, yo, registrarVista, toast, calificar } = useStore();
  const [calif, setCalif] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [califBusy, setCalifBusy] = useState(false);
  const [fotoN, setFotoN] = useState(0);
  const [wa, setWa] = useState(false);
  const [reporte, setReporte] = useState(false);
  const [motivo, setMotivo] = useState("");
  const tilt = useTilt<HTMLDivElement>(5);

  const a = db?.anuncios.find((x) => x.id === id);
  useEffect(() => {
    if (a?.id) registrarVista(a.id);
  }, [a?.id, registrarVista]);

  const origen = ubicacion(db?.busquedaUbicacionId ?? "naucalpan");
  const parecidos = useMemo(() => (db && a ? cercanos(db, origen, 4, a.id, a.subId) : []), [db, a, origen]);

  if (!db) {
    return (
      <div className="page wrap">
        <div className="detail">
          <div className="skel" style={{ aspectRatio: "4 / 3", borderRadius: 16 }} />
          <div className="stack">
            <Skel h={34} w="80%" />
            <Skel h={22} w="40%" />
            <Skel h={140} />
            <Skel h={90} />
          </div>
        </div>
      </div>
    );
  }
  if (!a) {
    return (
      <div className="page wrap">
        <Empty icon={<PackageCheck size={28} />} title="Este anuncio ya no está" action={<Link href="/buscar" className="btn btn-primary">Buscar material parecido</Link>}>
          Puede que el vendedor lo haya retirado. El material que sobra en las obras se mueve rápido.
        </Empty>
      </div>
    );
  }

  const u = ubicacion(a.ubicacionId);
  const km = distanciaKm(origen, u);
  const vendedor = db.usuarios.find((x) => x.id === a.vendedorId)!;
  const cat = db.categorias.find((c) => c.id === a.catId);
  const sub = cat?.sub.find((s) => s.id === a.subId);
  const esMio = yo?.id === a.vendedorId;
  const activo = visible(a, db.hoy);
  const anunciosVendedor = db.anuncios.filter((x) => x.vendedorId === vendedor.id && visible(x, db.hoy)).length;

  const total = (a.minimo ?? 1) * a.precio;

  return (
    <div className="page has-mobile-cta">
      <div className="wrap">
        <div className="row small" style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <Link href="/buscar" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Resultados
          </Link>
          <span className="muted">
            {cat?.nombre} · {sub?.nombre}
          </span>
        </div>

        {!activo && (
          <div className="banner warn" style={{ marginBottom: 16 }}>
            <Clock3 size={18} />
            <span>
              {a.estado === "agotado" ? "El vendedor marcó cero existencias, por eso este anuncio no aparece en las búsquedas." : a.estado === "vencido" ? `Este anuncio cumplió su vigencia el ${fechaCorta(a.venceEl)} y ya no aparece en las búsquedas.` : "Este anuncio está pausado y no aparece en las búsquedas."}
              {esMio && " Puede reactivarlo desde su panel."}
            </span>
          </div>
        )}

        <div className="detail">
          <div>
            <div className="gallery-main" ref={tilt}>
              <img key={fotoN} src={foto(a.fotos[fotoN] ?? a.fotos[0], 1200, 900)} alt={a.titulo} width={1200} height={900} />
              <div className="lc-tags">
                {destacadoActivo(a, db) && (
                  <span className="badge" style={{ background: "var(--accent)", color: "#fff" }}>
                    <Sparkles size={12} /> Destacado
                  </span>
                )}
                <span className={`badge ${a.condicion === "Nuevo" ? "ok" : a.condicion === "Seminuevo" ? "sup" : ""}`}>{a.condicion}</span>
              </div>
            </div>
            {a.fotos.length > 1 && (
              <div className="thumbs">
                {a.fotos.map((f, n) => (
                  <button key={f + n} className={n === fotoN ? "on" : ""} onClick={() => setFotoN(n)} aria-label={`Foto ${n + 1}`}>
                    <img src={foto(f, 200, 150)} alt="" width={84} height={64} />
                  </button>
                ))}
              </div>
            )}

            <div className="card card-pad" style={{ marginTop: 18 }}>
              <h3 className="h3" style={{ marginBottom: 10 }}>
                Detalles
              </h3>
              <p style={{ color: "var(--ink-2)" }}>{a.descripcion}</p>
              <dl className="specs" style={{ marginTop: 16 }}>
                {sub?.campos.map((c) =>
                  a.campos[c.id] ? (
                    <div key={c.id}>
                      <dt>{c.etiqueta}</dt>
                      <dd>
                        {a.campos[c.id]}
                        {c.sufijo ? ` ${c.sufijo}` : ""}
                      </dd>
                    </div>
                  ) : null,
                )}
                <div>
                  <dt>Condición</dt>
                  <dd>{a.condicion}</dd>
                </div>
                <div>
                  <dt>Venta mínima</dt>
                  <dd>{a.minimo ? cantidadUnidad(a.minimo, a.unidad) : "Sin mínimo"}</dd>
                </div>
                <div>
                  <dt>Factura</dt>
                  <dd>{a.factura ? "Sí emite" : "No emite"}</dd>
                </div>
                <div>
                  <dt>Entrega</dt>
                  <dd>{a.flete ? "Ofrece flete con costo" : "Se recoge en sitio"}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="stack">
            <div>
              <h1 className="h2">{a.titulo}</h1>
              <div className="row small muted" style={{ marginTop: 8, flexWrap: "wrap", fontWeight: 700 }}>
                <MapPin size={15} /> {etiquetaLugar(u)}
                <span>·</span>
                <Navigation size={14} /> {textoDistancia(km)} de C.P. {origen.cp}
              </div>
            </div>

            <div className="card card-pad">
              <div className="lc-price" style={{ fontSize: 32 }}>
                {pesos(a.precio)} <span>por {a.unidad}</span>
              </div>
              {a.minimo && (
                <div className="muted small" style={{ marginTop: 2 }}>
                  Desde {cantidadUnidad(a.minimo, a.unidad)}: {pesos(total)}
                </div>
              )}
              <div className="stack-box" style={{ marginTop: 14 }}>
                <Pila tipo={tipoPila(a.subId)} cantidad={a.cantidad} maximo={a.cantidadInicial} />
                <div className="stack-label">Disponible: {cantidadUnidad(a.cantidad, a.unidad)}</div>
              </div>
              <div className="wrap-row" style={{ marginTop: 12 }}>
                {a.factura && (
                  <span className="badge">
                    <Receipt size={12} /> Emite factura
                  </span>
                )}
                <span className="badge">
                  <Truck size={12} /> {a.flete ? "Ofrece flete" : "Se recoge en sitio"}
                </span>
                <span className="badge">
                  <CalendarDays size={12} /> Publicado el {fechaCorta(a.publicadoEl)}
                </span>
                <span className="badge">
                  <Eye size={12} /> {numero(a.vistas)} vistas
                </span>
              </div>
              {esMio ? (
                <Link href={`/publicar?editar=${a.id}`} className="btn btn-dark btn-block" style={{ marginTop: 16 }}>
                  <Pencil size={17} /> Editar mi anuncio
                </Link>
              ) : (
                <button className="btn btn-wa btn-block" style={{ marginTop: 16, minHeight: 52 }} onClick={() => setWa(true)} disabled={!activo}>
                  <MessageCircle size={19} /> Escribir por WhatsApp
                </button>
              )}
              <p className="muted small" style={{ marginTop: 10 }}>
                El trato, el pago y la entrega se arreglan directo con el vendedor. Revise el material antes de pagar.
              </p>
            </div>

            <div className="card card-pad">
              <div className="seller">
                <Avatar foto={vendedor.foto} alt={vendedor.nombre} />
                <div style={{ minWidth: 0 }}>
                  <b>{vendedor.negocio}</b>
                  <div className="muted small">
                    {vendedor.tipo} · {vendedor.nombre}
                  </div>
                  <div className="row small" style={{ marginTop: 4, color: "var(--ok)", fontWeight: 800 }}>
                    <BadgeCheck size={15} /> WhatsApp confirmado {enmascararTel(vendedor.telefono)}
                  </div>
                  {db.etapa2.calificaciones && (
                    <div className="row small" style={{ marginTop: 4, gap: 4, fontWeight: 800 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={14} fill={(promedio(db, vendedor.id) ?? 0) >= n - 0.25 ? "#d9a21b" : "none"} color="#d9a21b" />
                      ))}
                      <span style={{ marginLeft: 4 }}>{promedio(db, vendedor.id)?.toFixed(1) ?? "Sin calificar"}</span>
                      <span className="muted">({vendedor.calif?.n ?? 0} {vendedor.calif?.n === 1 ? "opinión" : "opiniones"})</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="row small muted" style={{ marginTop: 12, fontWeight: 700, flexWrap: "wrap" }}>
                <span>En {db.marca.nombre} desde {fechaLarga(vendedor.registradoEl)}</span>
                <span>·</span>
                <span>
                  {anunciosVendedor} {anunciosVendedor === 1 ? "anuncio activo" : "anuncios activos"}
                </span>
              </div>
              <div className="row small" style={{ marginTop: 10, fontWeight: 700 }}>
                <Clock3 size={14} color="var(--muted)" /> <span className="muted">Vigente hasta el {fechaCorta(a.venceEl)} ({faltan(a.venceEl, db.hoy)})</span>
              </div>
            </div>

            {!esMio && (
              <div className="row" style={{ flexWrap: "wrap" }}>
                {db.etapa2.calificaciones && (
                  <button className="btn btn-sm" onClick={() => setCalif(true)}>
                    <Star size={15} /> Calificar al vendedor
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setReporte(true)}>
                  <Flag size={15} /> Reportar este anuncio
                </button>
              </div>
            )}
          </div>
        </div>

        {parecidos.length > 0 && (
          <section className="section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Más {sub?.nombre.toLowerCase()}</div>
                <h2 className="h2" style={{ marginTop: 6 }}>Parecido y cerca de usted</h2>
              </div>
            </div>
            <div className="cards">
              {parecidos.map((r, i) => (
                <ListingCard key={r.a.id} a={r.a} u={r.u} km={r.km} hoy={db.hoy} i={i} otroEstado={r.u.estado !== origen.estado} {...extrasTarjeta(db, r.a)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {!esMio && activo && (
        <div className="mobile-cta">
          <div style={{ minWidth: 0 }}>
            <b>{pesos(a.precio)}</b> <span className="muted small">/ {a.unidad}</span>
            <div className="small muted">{textoDistancia(km)}</div>
          </div>
          <span className="spacer" />
          <button className="btn btn-wa" onClick={() => setWa(true)}>
            <MessageCircle size={17} /> WhatsApp
          </button>
        </div>
      )}

      <WhatsAppModal open={wa} onClose={() => setWa(false)} a={a} vendedor={vendedor} desde={origen} />
      <Modal
        open={calif}
        onClose={() => setCalif(false)}
        title={`Calificar a ${vendedor.negocio}`}
        icon={<Star size={19} color="#d9a21b" />}
        foot={
          <>
            <button className="btn" onClick={() => setCalif(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={!estrellas || califBusy}
              onClick={async () => {
                setCalifBusy(true);
                await calificar(vendedor.id, estrellas);
                setCalifBusy(false);
                setCalif(false);
                setEstrellas(0);
              }}
            >
              {califBusy ? <Spin /> : <Star size={16} />} Enviar
            </button>
          </>
        }
      >
        <p className="muted small" style={{ marginBottom: 12 }}>
          Solo pueden calificar quienes le escribieron por WhatsApp desde el sitio. Cuenta si el material era como en las fotos y si el vendedor cumplió con lo que dijo.
        </p>
        <div className="row" style={{ gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className="icon-btn" onClick={() => setEstrellas(n)} aria-label={`${n} estrellas`}>
              <Star size={28} fill={estrellas >= n ? "#d9a21b" : "none"} color="#d9a21b" />
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={reporte}
        onClose={() => setReporte(false)}
        title="Reportar anuncio"
        icon={<Flag size={19} color="var(--err)" />}
        foot={
          <>
            <button className="btn" onClick={() => setReporte(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={!motivo}
              onClick={() => {
                setReporte(false);
                setMotivo("");
                toast("Gracias. Lo revisamos y, si procede, el anuncio se suspende.");
              }}
            >
              Enviar reporte
            </button>
          </>
        }
      >
        <div className="stack" style={{ gap: 8 }}>
          {MOTIVOS.map((m) => (
            <button key={m} className={`pick ${motivo === m ? "on" : ""}`} onClick={() => setMotivo(m)} style={{ fontWeight: 700 }}>
              {m}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
