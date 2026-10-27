"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BellPlus, ArrowUpRight, Map as MapIcon, MapPin, Search, SearchX, Sparkles, Waypoints, LocateFixed, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { buscar, type Filtros, extrasTarjeta } from "@/lib/engine";
import { buscarCP, RADIOS, ubicacion, etiquetaLugar, abreviaEstado, UBICACIONES, distanciaKm, textoDistancia } from "@/lib/geo";
import ListingCard from "@/components/ListingCard";
import { CardSkel, Empty, Modal, Spin, Toggle, useCargando } from "@/components/ui";
import { Mapa } from "@/components/three/Scenes";

const POR_PAGINA = 12;

function Buscador() {
  const sp = useSearchParams();
  const router = useRouter();
  const { db, fijarUbicacion, crearAlerta, registrarBusquedaFallida } = useStore();
  const [alerta, setAlerta] = useState(false);
  const [alertaEmail, setAlertaEmail] = useState("");
  const [alertaKm, setAlertaKm] = useState(25);
  const [alertaBusy, setAlertaBusy] = useState(false);
  const registradas = useRef(new Set<string>());

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [qInput, setQInput] = useState(sp.get("q") ?? "");
  const [cp, setCp] = useState(sp.get("cp") ?? "");
  const [cpInput, setCpInput] = useState(sp.get("cp") ?? "");
  const [cpErr, setCpErr] = useState(false);
  const r0 = sp.get("r");
  const [radio, setRadio] = useState<number | null>(r0 === "mx" ? null : r0 ? Number(r0) : 25);
  const [auto, setAuto] = useState(sp.get("auto") !== "0");
  const [f, setF] = useState<Omit<Filtros, "q">>({ catId: sp.get("cat") ?? "", subId: sp.get("sub") ?? "", condicion: "", factura: false, flete: false, orden: "distancia" });
  const [pagina, setPagina] = useState(1);
  const [verMapa, setVerMapa] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // el código postal manda; si no hay, se usa el último lugar buscado
  const origen = useMemo(() => {
    const porCp = cp ? buscarCP(cp) : null;
    return porCp ?? ubicacion(db?.busquedaUbicacionId ?? "naucalpan");
  }, [cp, db?.busquedaUbicacionId]);

  // el campo del código postal se llena con el lugar de búsqueda la primera vez
  const [cpListo, setCpListo] = useState(false);
  useEffect(() => {
    if (!cpListo && db) {
      setCpInput((v) => v || origen.cp);
      setCpListo(true);
    }
  }, [cpListo, db, origen.cp]);

  useEffect(() => {
    if (db && origen.id !== db.busquedaUbicacionId) fijarUbicacion(origen.id);
  }, [origen.id, db, fijarUbicacion]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("cp", origen.cp);
    if (f.catId) p.set("cat", f.catId);
    if (f.subId) p.set("sub", f.subId);
    p.set("r", radio === null ? "mx" : String(radio));
    if (!auto) p.set("auto", "0");
    router.replace(`/buscar?${p.toString()}`, { scroll: false });
    setPagina(1);
  }, [q, origen.cp, f.catId, f.subId, radio, auto, router]);

  const firma = JSON.stringify([q, origen.id, radio, auto, f]);
  const cargando = useCargando(firma, 520);
  const res = useMemo(() => (db ? buscar(db, { ...f, q }, origen, radio, auto) : null), [db, f, q, origen, radio, auto]);
  const cat = db?.categorias.find((c) => c.id === f.catId);
  const pins = useMemo(() => {
    if (!db || !res) return [];
    const dentro = new Set(res.resultados.map((r) => r.a.id));
    const base = res.resultados.length ? res.resultados : [];
    return base.map((r) => ({ id: r.a.id, lat: r.u.lat + ((r.a.id.charCodeAt(5) % 7) - 3) * 0.004, lng: r.u.lng + ((r.a.id.charCodeAt(4) % 7) - 3) * 0.004, dentro: dentro.has(r.a.id) }));
  }, [db, res]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const u = buscarCP(cpInput);
    if (!u) {
      setCpErr(true);
      return;
    }
    setCpErr(false);
    setCp(u.cp);
    setQ(qInput.trim());
  };

  const usarUbicacion = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      const yo = { lat: p.coords.latitude, lng: p.coords.longitude };
      const u = [...UBICACIONES].sort((a, b) => distanciaKm(yo, a) - distanciaKm(yo, b))[0];
      setCp(u.cp);
      setCpInput(u.cp);
    });
  };

  const radioUsadoEtq = res ? RADIOS.find((r) => r.km === res.radioUsado)?.etiqueta : "";
  const lista = res?.resultados ?? [];
  const visibles = lista.slice(0, pagina * POR_PAGINA);
  const masCercano = lista[0];

  // lo que se buscó y no había cerca queda anotado para el tablero del mes
  useEffect(() => {
    if (!res || cargando || !q.trim() || res.enRadioPedido > 0) return;
    const k = `${q}|${origen.id}|${radio}`;
    if (registradas.current.has(k)) return;
    registradas.current.add(k);
    registrarBusquedaFallida(q, origen.id, lista[0] ? Math.round(lista[0].km) : null);
  }, [res, cargando, q, origen.id, radio, lista, registrarBusquedaFallida]);

  const panelFiltros = (
    <div className="card filters">
      <div>
        <h4>Desde dónde busca</h4>
        <div className="row small" style={{ fontWeight: 800 }}>
          <MapPin size={15} color="var(--sup)" /> {etiquetaLugar(origen)}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, paddingLeft: 0 }} onClick={usarUbicacion}>
          <LocateFixed size={15} /> Usar mi ubicación
        </button>
      </div>
      <div>
        <h4>Distancia</h4>
        <div className="radius-row">
          {RADIOS.map((r) => {
            const n = res?.conteos.find((c) => c.km === r.km)?.n ?? 0;
            return (
              <button key={r.etiqueta} className={`chip ${radio === r.km ? "on" : ""}`} onClick={() => setRadio(r.km)}>
                {r.etiqueta} <span className="n">{n}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12 }}>
          <Toggle checked={auto} onChange={setAuto} label={<span className="small">Ampliar sola si hay menos de {db?.reglas.minResultados ?? 3}</span>} />
        </div>
      </div>
      <div>
        <h4>Categoría</h4>
        <select className="input" value={f.catId} onChange={(e) => setF({ ...f, catId: e.target.value, subId: "" })}>
          <option value="">Todas</option>
          {db?.categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {cat && (
          <select className="input" style={{ marginTop: 8 }} value={f.subId} onChange={(e) => setF({ ...f, subId: e.target.value })}>
            <option value="">Todo {cat.nombre.toLowerCase()}</option>
            {cat.sub.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <h4>Condición</h4>
        <div className="wrap-row">
          {["", "Nuevo", "Seminuevo", "Usado"].map((c) => (
            <button key={c || "todas"} className={`chip ${f.condicion === c ? "on" : ""}`} onClick={() => setF({ ...f, condicion: c })}>
              {c || "Todas"}
            </button>
          ))}
        </div>
      </div>
      <div className="stack" style={{ gap: 10 }}>
        <Toggle checked={f.factura} onChange={(v) => setF({ ...f, factura: v })} label="Solo con factura" />
        <Toggle checked={f.flete} onChange={(v) => setF({ ...f, flete: v })} label="El vendedor ofrece flete" />
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="wrap">
        <form className="searchbar" style={{ marginTop: 0, boxShadow: "var(--shadow-1)" }} onSubmit={enviar}>
          <label>
            <Search size={18} color="var(--muted)" />
            <input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Qué busca: varilla, block, revolvedora..." aria-label="Qué busca" />
          </label>
          <label style={cpErr ? { boxShadow: "0 0 0 2px var(--err)" } : undefined}>
            <MapPin size={18} color="var(--muted)" />
            <input
              value={cpInput}
              onChange={(e) => {
                setCpInput(e.target.value.replace(/\D/g, "").slice(0, 5));
                setCpErr(false);
              }}
              inputMode="numeric"
              aria-label="Código postal"
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Buscar
          </button>
        </form>
        {cpErr && <p className="err-text" style={{ marginTop: 8 }}>No encontramos ese código postal. Revise los cinco dígitos.</p>}

        <div className="search-layout" style={{ marginTop: 22 }}>
          <div>
            <button className="btn btn-sm show-filters" onClick={() => setFiltrosAbiertos((v) => !v)} style={{ marginBottom: 12 }}>
              <SlidersHorizontal size={15} /> {filtrosAbiertos ? "Ocultar filtros" : "Filtros y distancia"}
            </button>
            <div className={`filters-box ${filtrosAbiertos ? "open" : ""}`}>{panelFiltros}</div>
          </div>

          <div>
            <div className="results-head">
              <div>
                <h1 className="h2">{q ? `"${q}"` : cat ? cat.nombre : "Todo el material"}</h1>
                <div className="muted small" style={{ fontWeight: 700 }}>
                  {cargando || !res ? "Buscando..." : `${lista.length} ${lista.length === 1 ? "anuncio" : "anuncios"} · ${res.radioUsado === null ? `en todo México, del más cercano a ${origen.municipio} al más lejano` : `a ${radioUsadoEtq} o menos de ${origen.municipio}`}`}
                </div>
              </div>
              <span className="spacer" />
              <button className="btn btn-sm" onClick={() => setVerMapa((v) => !v)}>
                <MapIcon size={15} /> {verMapa ? "Ocultar mapa" : "Ver mapa"}
              </button>
              <select className="input" style={{ width: "auto", minHeight: 36 }} value={f.orden} onChange={(e) => setF({ ...f, orden: e.target.value as Filtros["orden"] })} aria-label="Ordenar">
                <option value="distancia">Más cerca primero</option>
                <option value="precio-asc">Precio más bajo</option>
                <option value="precio-desc">Precio más alto</option>
                <option value="recientes">Más recientes</option>
              </select>
            </div>

            <div className="stack" style={{ gap: 10, marginBottom: 16 }}>
              {res && !cargando && res.ampliado && (
                <div className="banner acc">
                  <Waypoints size={18} />
                  <span>
                    A {RADIOS.find((r) => r.km === radio)?.etiqueta} {res.enRadioPedido === 0 ? "no había ningún anuncio" : `solo había ${res.enRadioPedido}`}, así que la búsqueda se amplió hasta <b>{radioUsadoEtq}</b>.
                    {masCercano && (
                      <>
                        {" "}
                        El más cercano está {textoDistancia(masCercano.km)}, en {etiquetaLugar(masCercano.u)}.
                      </>
                    )}
                  </span>
                </div>
              )}
              {res && !cargando && res.sinonimos.length > 0 && (
                <div className="banner info">
                  <Sparkles size={18} />
                  <span>
                    También buscamos <b>{Array.from(new Set(res.sinonimos.map((s) => s.a))).join(", ")}</b>, porque en obra a {Array.from(new Set(res.sinonimos.map((s) => `"${s.de}"`))).join(" y ")} se le dice de varias formas.
                  </span>
                </div>
              )}
              {res && !cargando && res.otrosEstados > 0 && res.radioUsado !== null && (
                <div className="banner ok">
                  <MapPin size={18} />
                  <span>
                    {res.otrosEstados} de estos anuncios están en {res.estadosVecinos.map(abreviaEstado).join(" y ")}: otro estado, pero dentro de {radioUsadoEtq} de usted.
                  </span>
                </div>
              )}
            </div>

            {db?.etapa2.alertas && q && !cargando && (
              <div className="banner info" style={{ marginBottom: 14, alignItems: "center" }}>
                <BellPlus size={18} />
                <span style={{ flex: 1 }}>
                  Si hoy no está lo que busca, le avisamos por correo cuando alguien publique <b>&quot;{q}&quot;</b> cerca de {origen.municipio}.
                </span>
                <button className="btn btn-sm btn-dark" onClick={() => setAlerta(true)}>
                  Avísenme
                </button>
              </div>
            )}
            {verMapa && (
              <div className="map-wrap" style={{ height: 320, minHeight: 0, marginBottom: 18 }}>
                {db && <Mapa centro={origen} estadoOrigen={origen.estado} radioKm={res ? res.radioUsado : radio} pins={pins} seleccionado={sel} onSelect={(id) => setSel(id)} />}
                {sel && db && (() => {
                  const r = lista.find((x) => x.a.id === sel);
                  if (!r) return null;
                  return (
                    <Link href={`/anuncio/${r.a.id}`} className="map-tip card" style={{ padding: 12, display: "block" }}>
                      <b className="small" style={{ display: "block", lineHeight: 1.3 }}>{r.a.titulo}</b>
                      <span className="small muted">
                        {textoDistancia(r.km)} · {etiquetaLugar(r.u)}
                      </span>
                      <span className="small" style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6, fontWeight: 800, color: "var(--accent)" }}>
                        Ver anuncio <ArrowUpRight size={14} />
                      </span>
                    </Link>
                  );
                })()}
              </div>
            )}

            <div className="cards">
              {(cargando || !res) && Array.from({ length: 6 }, (_, i) => <CardSkel key={i} />)}
              {!cargando && res && visibles.map((r, i) => <ListingCard key={r.a.id} a={r.a} u={r.u} km={r.km} hoy={db!.hoy} i={i} otroEstado={r.u.estado !== origen.estado} {...extrasTarjeta(db!, r.a)} />)}
            </div>
            {!cargando && res && lista.length === 0 && (
              <Empty icon={<SearchX size={28} />} title="Nada con esos filtros" action={radio !== null ? <button className="btn btn-primary" onClick={() => setRadio(null)}>Buscar en todo México</button> : undefined}>
                {res.total === 0 ? "No hay anuncios activos que coincidan con lo que escribió. Pruebe con otra palabra o quite algún filtro." : `Hay ${res.total} en otras partes del país, fuera de la distancia elegida.`}
              </Empty>
            )}
            {!cargando && lista.length > visibles.length && (
              <div style={{ textAlign: "center", marginTop: 22 }}>
                <button className="btn" onClick={() => setPagina((p) => p + 1)}>
                  Ver {Math.min(POR_PAGINA, lista.length - visibles.length)} más
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ModalAlerta
        open={alerta}
        onClose={() => setAlerta(false)}
        q={q}
        lugar={origen.municipio}
        km={alertaKm}
        setKm={setAlertaKm}
        email={alertaEmail}
        setEmail={setAlertaEmail}
        busy={alertaBusy}
        onSave={async () => {
          setAlertaBusy(true);
          await crearAlerta(q, origen.id, alertaKm, alertaEmail.trim());
          setAlertaBusy(false);
          setAlerta(false);
        }}
      />
    </div>
  );
}

function ModalAlerta({ open, onClose, q, lugar, km, setKm, email, setEmail, busy, onSave }: { open: boolean; onClose: () => void; q: string; lugar: string; km: number; setKm: (n: number) => void; email: string; setEmail: (s: string) => void; busy: boolean; onSave: () => void }) {
  const valido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Avisarme cuando aparezca"
      icon={<BellPlus size={19} color="var(--sup)" />}
      foot={
        <>
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" disabled={!valido || busy} onClick={onSave}>
            {busy ? <Spin /> : <BellPlus size={16} />} Crear alerta
          </button>
        </>
      }
    >
      <div className="stack">
        <p className="muted small">
          Cuando un vendedor publique &quot;{q}&quot; dentro de la distancia que elija desde {lugar}, le llega un correo con el anuncio. El vendedor también ve que hay compradores esperando ese material.
        </p>
        <div className="wrap-row">
          {[10, 25, 50, 100].map((n) => (
            <button key={n} className={`chip ${km === n ? "on" : ""}`} onClick={() => setKm(n)}>
              {n} km
            </button>
          ))}
        </div>
        <label className="field">
          <span>Su correo</span>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="compras@suempresa.mx" />
        </label>
      </div>
    </Modal>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="page wrap" />}>
      <Buscador />
    </Suspense>
  );
}
