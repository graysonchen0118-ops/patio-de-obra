"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Coins, MapPin, MessageCircle, Search, UserPlus, Camera, Navigation, BrickWall, PaintRoller, Wrench, Layers, Hammer, Truck } from "lucide-react";
import { useStore } from "@/lib/store";
import { buscar, cercanos, FILTROS_VACIOS, visible } from "@/lib/engine";
import { buscarCP, RADIOS, ubicacion, etiquetaLugar, abreviaEstado } from "@/lib/geo";
import { foto } from "@/lib/photos";
import { pesos, numero } from "@/lib/format";
import { Yard, Mapa } from "@/components/three/Scenes";
import ListingCard from "@/components/ListingCard";
import { CardSkel, Reveal, useTilt } from "@/components/ui";

const ICONOS: Record<string, typeof BrickWall> = { BrickWall, PaintRoller, Wrench, Layers, Hammer, Truck };

const RAPIDAS = [
  { q: "fierro", cp: "53000", etiqueta: "Fierro cerca de Naucalpan" },
  { q: "triplay", cp: "72000", etiqueta: "Triplay desde Puebla" },
  { q: "revolvedora", cp: "64000", etiqueta: "Revolvedora en Monterrey" },
  { q: "tabicón", cp: "09000", etiqueta: "Tabicón en Iztapalapa" },
];

function CatCard({ id, nombre, fotoK, n, icono, i }: { id: string; nombre: string; fotoK: string; n: number; icono: string; i: number }) {
  const ref = useTilt<HTMLAnchorElement>(8);
  const Icon = ICONOS[icono] ?? BrickWall;
  return (
    <Link ref={ref} href={`/buscar?cat=${id}`} className="cat-card" style={{ animationDelay: `${i * 60}ms` }}>
      <img src={foto(fotoK, 720, 480)} alt={nombre} width={720} height={480} loading="lazy" />
      <div className="in">
        <Icon size={22} />
        <b>{nombre}</b>
        <span>{n} anuncios activos</span>
      </div>
    </Link>
  );
}

export default function Inicio() {
  const router = useRouter();
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [cp, setCp] = useState("53000");
  const [cpErr, setCpErr] = useState(false);
  const [radio, setRadio] = useState<number | null>(25);
  const [sel, setSel] = useState<string | null>(null);

  const origen = ubicacion(db?.busquedaUbicacionId ?? "naucalpan");
  const cerca = useMemo(() => (db ? cercanos(db, origen, 8) : []), [db, origen]);
  const recientes = useMemo(() => (db ? db.anuncios.filter((a) => visible(a, db.hoy)).sort((a, b) => b.publicadoEl.localeCompare(a.publicadoEl)).slice(0, 4) : []), [db]);
  const mapa = useMemo(() => (db ? buscar(db, FILTROS_VACIOS, origen, radio, false) : null), [db, origen, radio]);
  const pins = useMemo(() => {
    if (!db) return [];
    const dentro = new Set(mapa?.resultados.map((r) => r.a.id));
    return db.anuncios
      .filter((a) => visible(a, db.hoy))
      .map((a) => {
        const u = ubicacion(a.ubicacionId);
        return { id: a.id, lat: u.lat + ((a.id.charCodeAt(5) % 7) - 3) * 0.004, lng: u.lng + ((a.id.charCodeAt(4) % 7) - 3) * 0.004, dentro: dentro.has(a.id) };
      });
  }, [db, mapa]);
  const selA = sel && db ? db.anuncios.find((a) => a.id === sel) : null;
  const totalActivos = db ? db.anuncios.filter((a) => visible(a, db.hoy)).length : 0;
  const estados = db ? new Set(db.anuncios.filter((a) => visible(a, db.hoy)).map((a) => ubicacion(a.ubicacionId).estado)).size : 0;

  const ir = (qq: string, cpp: string) => {
    const u = buscarCP(cpp);
    if (!u) {
      setCpErr(true);
      return;
    }
    router.push(`/buscar?q=${encodeURIComponent(qq)}&cp=${u.cp}`);
  };

  return (
    <>
      <section className="hero">
        <Yard />
        <div className="hero-in">
          <div className="wrap">
            <div className="hero-copy">
              <div className="eyebrow">Material sobrante de obra · nuevo y usado</div>
              <h1 className="h1" style={{ marginTop: 10 }}>
                Lo que sobró en una obra, <span>a unos kilómetros</span> de la siguiente.
              </h1>
              <p className="lead">Cemento, varilla, block, herramienta y maquinaria en todo México. Busque gratis desde su código postal y hable directo con quien vende por WhatsApp.</p>
              <form
                className="searchbar"
                onSubmit={(e) => {
                  e.preventDefault();
                  ir(q, cp);
                }}
              >
                <label>
                  <Search size={18} color="var(--muted)" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Varilla, block, revolvedora..." aria-label="Qué busca" />
                </label>
                <label style={cpErr ? { boxShadow: "0 0 0 2px var(--err)" } : undefined}>
                  <MapPin size={18} color="var(--muted)" />
                  <input
                    value={cp}
                    onChange={(e) => {
                      setCp(e.target.value.replace(/\D/g, "").slice(0, 5));
                      setCpErr(false);
                    }}
                    inputMode="numeric"
                    placeholder="C.P."
                    aria-label="Código postal"
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Buscar <ArrowRight size={17} />
                </button>
              </form>
              {cpErr && <p className="err-text" style={{ marginTop: 8 }}>No encontramos ese código postal. Revise los cinco dígitos.</p>}
              <div className="quick">
                {RAPIDAS.map((r) => (
                  <button key={r.etiqueta} className="chip" onClick={() => ir(r.q, r.cp)}>
                    <Navigation size={13} /> {r.etiqueta}
                  </button>
                ))}
              </div>
              <div className="hero-stats">
                <div>
                  <b>{db ? numero(totalActivos) : "·"}</b>
                  <span>anuncios activos</span>
                </div>
                <div>
                  <b>{db ? estados : "·"}</b>
                  <span>estados con material</span>
                </div>
                <div>
                  <b>{pesos(0)}</b>
                  <span>buscar y escribir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Cerca de {etiquetaLugar(origen)}</div>
              <h2 className="h2" style={{ marginTop: 6 }}>Lo más cercano a usted</h2>
            </div>
            <Link href={`/buscar?cp=${origen.cp}`} className="btn btn-ghost">
              Ver todo <ArrowRight size={16} />
            </Link>
          </div>
          <div className="cards">
            {!db && Array.from({ length: 8 }, (_, i) => <CardSkel key={i} />)}
            {db && cerca.map((r, i) => <ListingCard key={r.a.id} a={r.a} u={r.u} km={r.km} hoy={db.hoy} i={i} otroEstado={r.u.estado !== origen.estado} />)}
          </div>
        </section>

        <section className="section">
          <Reveal>
            <div className="section-head">
              <div>
                <div className="eyebrow">Búsqueda por distancia</div>
                <h2 className="h2" style={{ marginTop: 6 }}>Lo local se mide en kilómetros, no en estados</h2>
                <p className="lead" style={{ marginTop: 8 }}>
                  {origen.estado === "Ciudad de México" || origen.estado === "Estado de México"
                    ? `Desde ${origen.municipio} el radio cruza a ${origen.estado === "Ciudad de México" ? "el Estado de México" : "la Ciudad de México"} sin que usted haga nada.`
                    : "El radio no se detiene en la línea del estado."}{" "}
                  Si cerca no hay, la búsqueda se abre sola hasta todo el país.
                </p>
              </div>
            </div>
          </Reveal>
          <div className="map-wrap" style={{ height: 460 }}>
            {db && <Mapa centro={origen} estadoOrigen={origen.estado} radioKm={radio} pins={pins} seleccionado={sel} onSelect={setSel} />}
            <div className="map-legend">
              <span>
                <i style={{ background: "var(--sup)" }} />
                Usted, C.P. {origen.cp}
              </span>
              <span>
                <i style={{ background: "var(--accent)" }} />
                Dentro del radio
              </span>
              <span>
                <i style={{ background: "#97a2a8" }} />
                Fuera del radio
              </span>
            </div>
            {selA && db && (
              <div className="map-tip card card-pad" style={{ padding: 12 }}>
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <img src={foto(selA.fotos[0], 160, 120)} alt="" width={64} height={48} style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8 }} />
                  <div style={{ minWidth: 0 }}>
                    <b className="small" style={{ display: "block", lineHeight: 1.3 }}>{selA.titulo}</b>
                    <span className="small muted">{etiquetaLugar(ubicacion(selA.ubicacionId))}</span>
                  </div>
                </div>
                <Link href={`/anuncio/${selA.id}`} className="btn btn-sm btn-dark btn-block" style={{ marginTop: 10 }}>
                  Ver anuncio
                </Link>
              </div>
            )}
            <div className="map-overlay">
              {RADIOS.map((r) => {
                const n = mapa?.conteos.find((c) => c.km === r.km)?.n ?? 0;
                return (
                  <button key={r.etiqueta} className={`chip ${radio === r.km ? "on" : ""}`} onClick={() => setRadio(r.km)}>
                    {r.etiqueta} <span className="n">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {mapa && mapa.otrosEstados > 0 && radio !== null && (
            <div className="banner info" style={{ marginTop: 14 }}>
              <MapPin size={18} />
              <span>
                A {radio} km de {origen.municipio} hay <b>{mapa.resultados.length} anuncios</b>, y <b>{mapa.otrosEstados}</b> están en {mapa.estadosVecinos.map(abreviaEstado).join(" y ")}. Con una búsqueda por estado no aparecerían{origen.estado === "Estado de México" && radio <= 25 ? ", aunque quedan más cerca que Toluca, la capital del suyo" : ""}.
              </span>
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Categorías</div>
              <h2 className="h2" style={{ marginTop: 6 }}>De la obra negra a la maquinaria</h2>
            </div>
          </div>
          <div className="cards">
            {db?.categorias.map((c, i) => (
              <CatCard key={c.id} id={c.id} nombre={c.nombre} fotoK={c.foto} icono={c.icono} i={i} n={db.anuncios.filter((a) => a.catId === c.id && visible(a, db.hoy)).length} />
            ))}
          </div>
        </section>

        <section className="section" id="como-funciona">
          <Reveal>
            <div className="section-head">
              <div>
                <div className="eyebrow">Para quien vende</div>
                <h2 className="h2" style={{ marginTop: 6 }}>Su primer anuncio va por nuestra cuenta</h2>
                <p className="lead" style={{ marginTop: 8 }}>Regístrese con su WhatsApp y reciba un crédito de bienvenida válido por 30 días. Después publica con créditos prepagados, y el trato lo cierra usted directo con el comprador.</p>
              </div>
              <Link href="/registro" className="btn btn-primary">
                <UserPlus size={17} /> Crear cuenta
              </Link>
            </div>
          </Reveal>
          <div className="how">
            {[
              { i: BadgeCheck, t: "Confirme su WhatsApp", d: "Le llega un código por WhatsApp. Ese número es el que verán los compradores, y el crédito de regalo se da una sola vez por número." },
              { i: Camera, t: "Publique con fotos y cantidad", d: "Precio por unidad, cuántos le quedan y dónde está el material. Cuando vende una parte, cambia la cantidad en un clic." },
              { i: MessageCircle, t: "Le escriben ya con el dato", d: "El mensaje llega con el nombre del lote y el precio. El sitio no cobra comisión ni se mete en la venta ni en la entrega." },
            ].map((x, n) => (
              <Reveal key={x.t} delay={n * 90}>
                <div className="card" style={{ height: "100%" }}>
                  <div className="ico">
                    <x.i size={22} />
                  </div>
                  <h3 className="h3">{x.t}</h3>
                  <p className="muted" style={{ marginTop: 6 }}>
                    {x.d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          {db && (
            <Reveal delay={120}>
              <div className="packs" style={{ marginTop: 18 }}>
                {db.paquetes.map((p) => (
                  <Link key={p.id} href="/panel?tab=creditos" className="pack" style={{ display: "block" }}>
                    {p.destacado && <span className="badge acc tag">El más usado</span>}
                    <div className="row">
                      <Coins size={18} color="var(--accent)" />
                      <b>{p.nombre}</b>
                    </div>
                    <div className="big" style={{ marginTop: 6 }}>
                      {pesos(p.precio)}
                    </div>
                    <div className="small muted">
                      {p.creditos} {p.creditos === 1 ? "anuncio" : "anuncios"} de 30 días · vigencia 6 meses
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Recién publicados</div>
              <h2 className="h2" style={{ marginTop: 6 }}>Lo último que salió de las obras</h2>
            </div>
          </div>
          <div className="cards">
            {!db && Array.from({ length: 4 }, (_, i) => <CardSkel key={i} />)}
            {db && recientes.map((a, i) => <ListingCard key={a.id} a={a} u={ubicacion(a.ubicacionId)} hoy={db.hoy} i={i} />)}
          </div>
        </section>
      </div>
    </>
  );
}
