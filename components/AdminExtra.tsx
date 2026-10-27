"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Boxes, Check, CheckCircle2, ImagePlus, MessageCircle, Palette, Save, Smartphone, Sparkles, BellPlus, Star, Receipt, Upload, SearchX, Store, Timer, Users, Layers3, ClipboardList, Trash2 } from "lucide-react";
import type { Etapa2, Marca } from "@/lib/types";
import { useStore } from "@/lib/store";
import { buscar, FILTROS_VACIOS, llenadoZona, saldo, ZONAS } from "@/lib/engine";
import { buscarCP, etiquetaLugar, textoDistancia, ubicacion } from "@/lib/geo";
import { paleta, PRESETS, valido } from "@/lib/color";
import { fechaCorta, numero, pesos, diasEntre, plural } from "@/lib/format";
import { foto } from "@/lib/photos";
import { DESTACAR } from "@/lib/seed";
import { Spin, Toggle } from "./ui";
import { Etapas } from "./three/Scenes";

// ---------------------------------------------------------------- marca

async function reducirLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((ok, mal) => {
    img.onload = ok;
    img.onerror = mal;
    img.src = url;
  });
  const lado = 256;
  const k = Math.min(1, lado / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k);
  c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/png");
}

export function MarcaTab() {
  const { db, guardarMarca } = useStore();
  const [m, setM] = useState<Marca | null>(db ? { ...db.marca } : null);
  const [busy, setBusy] = useState(false);
  const [celular, setCelular] = useState(false);
  const [recarga, setRecarga] = useState(0);
  if (!db || !m) return null;
  const vars = paleta(m.color) as unknown as CSSProperties;
  const cambio = JSON.stringify(m) !== JSON.stringify(db.marca);

  return (
    <div className="cards-wide" style={{ alignItems: "start" }}>
      <div className="card step stack">
        <div className="step-head" style={{ marginBottom: 0 }}>
          <Palette size={20} color="var(--accent)" />
          <h3 className="h3">La marca de ustedes</h3>
        </div>
        <p className="small" style={{ color: "var(--ink-2)" }}>
          Nombre, frase, color y logotipo. Al guardar, todo el sitio se pinta con ellos: botones, mapa, fichas de créditos, correos y la vista en el celular.
        </p>
        <div className="form-grid">
          <label className="field">
            <span>Nombre del sitio</span>
            <input className="input" value={m.nombre} maxLength={28} onChange={(e) => setM({ ...m, nombre: e.target.value })} />
          </label>
          <label className="field">
            <span>Frase bajo el nombre</span>
            <input className="input" value={m.lema} maxLength={48} onChange={(e) => setM({ ...m, lema: e.target.value })} />
          </label>
        </div>
        <div className="field">
          <span>Color principal</span>
          <div className="wrap-row">
            {PRESETS.map((p) => (
              <button key={p.color} className={`chip ${m.color.toLowerCase() === p.color ? "on" : ""}`} onClick={() => setM({ ...m, color: p.color })}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: p.color, display: "inline-block" }} /> {p.nombre}
              </button>
            ))}
            <label className="chip" style={{ position: "relative" }}>
              <input type="color" value={valido(m.color) ? m.color : "#b5452b"} onChange={(e) => setM({ ...m, color: e.target.value })} style={{ width: 22, height: 22, border: 0, padding: 0, background: "none" }} aria-label="Elegir otro color" />
              Otro
            </label>
          </div>
        </div>
        <div className="field">
          <span>Logotipo</span>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className="brand-mark" style={{ ...vars, width: 52, height: 52, background: m.logo ? "#fff" : (vars as Record<string, string>)["--grad"], border: m.logo ? "1px solid var(--line)" : 0 }}>
              {m.logo ? <img src={m.logo} alt="" width={46} height={46} style={{ width: 46, height: 46, objectFit: "contain" }} /> : <Boxes size={24} color="#fff" />}
            </span>
            <label className="btn btn-sm">
              <Upload size={15} /> Subir logotipo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setM({ ...m, logo: await reducirLogo(f) });
                }}
              />
            </label>
            {m.logo && (
              <button className="btn btn-sm btn-ghost" onClick={() => setM({ ...m, logo: null })}>
                <Trash2 size={15} /> Quitar
              </button>
            )}
          </div>
          <small>PNG o JPG; se ajusta solo al tamaño del encabezado.</small>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => setCelular((v) => !v)}>
            <Smartphone size={16} /> {celular ? "Ocultar celular" : "Ver en el celular"}
          </button>
          <button
            className="btn btn-primary"
            disabled={!cambio || busy || m.nombre.trim().length < 2}
            onClick={async () => {
              setBusy(true);
              await guardarMarca({ ...m, nombre: m.nombre.trim(), lema: m.lema.trim() });
              setBusy(false);
              setTimeout(() => setRecarga((n) => n + 1), 600);
            }}
          >
            {busy ? <Spin /> : <Save size={17} />} Guardar marca
          </button>
        </div>
      </div>

      <div className="stack">
        <div className="card card-pad" style={vars}>
          <div className="muted small" style={{ fontWeight: 800, marginBottom: 10 }}>
            Así se ve antes de guardar
          </div>
          <div className="row" style={{ padding: 12, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
            <span className="brand-mark" style={m.logo ? { background: "#fff", padding: 3 } : undefined}>
              {m.logo ? <img src={m.logo} alt="" width={30} height={30} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Boxes size={20} />}
            </span>
            <span style={{ fontWeight: 900, fontSize: 18 }}>
              {m.nombre || "Su marca"}
              <small style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{m.lema}</small>
            </span>
          </div>
          <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-sm">Publicar anuncio</button>
            <span className="badge acc">Destacado</span>
            <span className="pill-credit">
              <span className="coin">
                <Sparkles size={12} />
              </span>
              28 créditos
            </span>
          </div>
          <div className="lc" style={{ marginTop: 14, maxWidth: 300, animation: "none" }}>
            <div className="lc-photo" style={{ aspectRatio: "16 / 9" }}>
              <img src={foto("cem1", 640, 360)} alt="" width={640} height={360} />
            </div>
            <div className="lc-body">
              <div className="lc-title">Cemento gris de 50 kg, 300 bultos</div>
              <div className="lc-price">
                {pesos(205)} <span>/ bulto</span>
              </div>
              <button className="btn btn-sm" style={{ background: "var(--grad)", color: "#fff", border: 0 }}>
                <MessageCircle size={15} /> Escribir por WhatsApp
              </button>
            </div>
          </div>
        </div>
        {celular && (
          <div className="card card-pad" style={{ display: "grid", placeItems: "center" }}>
            <div className="phone">
              <iframe key={recarga} src="/" title="Vista en celular" />
            </div>
            <p className="muted small" style={{ marginTop: 10, textAlign: "center" }}>
              El sitio real, a 390 px de ancho. Se puede navegar con el ratón.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- etapas

const PRIMERA = [
  { t: "Registro con WhatsApp verificado y crédito de bienvenida", href: "/registro" },
  { t: "Publicar con categorías, campos, fotos, cantidad y ubicación", href: "/publicar" },
  { t: "Búsqueda por distancia que se amplía sola", href: "/buscar?q=triplay&cp=72000" },
  { t: "Contacto directo por WhatsApp", href: "/anuncio/A-1011" },
  { t: "Créditos por lotes, cada compra con sus seis meses", href: "/panel?tab=creditos" },
  { t: "Cobro real con tarjeta, OXXO y SPEI", href: "/panel?tab=creditos" },
  { t: "Panel del vendedor y administración", href: "/panel" },
];

const SEGUNDA: { k: keyof Etapa2; t: string; d: string; icono: typeof Sparkles; donde: string; href: string }[] = [
  { k: "destacados", t: "Anuncios destacados", d: `El vendedor paga ${DESTACAR.creditos} créditos y su anuncio sale arriba ${DESTACAR.dias} días. Otra fuente de ingreso con lo mismo que ya existe.`, icono: Sparkles, donde: "Mi panel, botón Destacar", href: "/panel" },
  { k: "alertas", t: "Alertas para compradores", d: "El que no encontró deja su correo y le avisamos cuando alguien publique ese material cerca. El vendedor ve que hay gente esperando.", icono: BellPlus, donde: "Buscar, aviso arriba de los resultados", href: "/buscar?q=tablaroca&cp=76000" },
  { k: "calificaciones", t: "Calificaciones de vendedores", d: "Estrellas en cada anuncio y en la ficha del vendedor. Solo califica quien le escribió desde el sitio.", icono: Star, donde: "Cualquier anuncio, junto al vendedor", href: "/anuncio/A-1044" },
  { k: "factura", t: "Factura de créditos", d: "Al comprar un paquete, el vendedor pone su RFC y la factura le llega sola en PDF y XML.", icono: Receipt, donde: "Comprar créditos", href: "/panel?tab=creditos" },
];

export function EtapasTab() {
  const { db, cambiarEtapa } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  if (!db) return null;
  const on = SEGUNDA.map((s) => db.etapa2[s.k]);
  const cuantos = on.filter(Boolean).length;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="cards-wide" style={{ alignItems: "start" }}>
        <div className="card step">
          <div className="step-head">
            <span className="step-num">1</span>
            <div>
              <h3 className="h3">Primera etapa: abre el negocio</h3>
              <div className="muted small">Todo lo que hace falta para que un vendedor publique, un comprador lo encuentre y el siguiente crédito se cobre.</div>
            </div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {PRIMERA.map((p) => (
              <Link key={p.t} href={p.href} className="row small" style={{ padding: "8px 10px", borderRadius: 10, background: "var(--surface-2)", fontWeight: 700 }}>
                <CheckCircle2 size={17} color="var(--ok)" />
                <span style={{ flex: 1 }}>{p.t}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="card step">
          <div className="step-head" style={{ marginBottom: 8 }}>
            <span className="step-num" style={{ background: "var(--accent)" }}>2</span>
            <div>
              <h3 className="h3">Segunda etapa: sobre las varillas de espera</h3>
              <div className="muted small">Encienda una función y se levanta un cuarto arriba, sin tocar la planta baja.</div>
            </div>
          </div>
          <div className="stack-box" style={{ height: 250 }}>
            <Etapas encendidos={on} />
            <div className="stack-label">{cuantos === 0 ? "Planta baja terminada, varillas listas" : `${cuantos} de 4 cuartos arriba`}</div>
          </div>
        </div>
      </div>
      <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {SEGUNDA.map((s) => (
          <div key={s.k} className="card card-pad stack" style={{ gap: 10, borderColor: db.etapa2[s.k] ? "var(--accent)" : undefined }}>
            <div className="row">
              <span className="avatar-icon" style={{ width: 38, height: 38, background: "var(--accent-soft)", color: "var(--accent)" }}>
                <s.icono size={18} />
              </span>
              <b style={{ flex: 1 }}>{s.t}</b>
              {busy === s.k ? (
                <Spin />
              ) : (
                <Toggle
                  checked={db.etapa2[s.k]}
                  onChange={async (v) => {
                    setBusy(s.k);
                    await cambiarEtapa(s.k, v);
                    setBusy(null);
                  }}
                  label={<span className="sr-only">{s.t}</span>}
                />
              )}
            </div>
            <p className="small" style={{ color: "var(--ink-2)" }}>
              {s.d}
            </p>
            <Link href={s.href} className="small" style={{ fontWeight: 800, color: "var(--accent)" }}>
              Dónde se ve: {s.donde}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- captura asistida

const EJEMPLO = ["Cemento gris 50 kg, bultos sellados | 40 | 192", "Cemento blanco de 25 kg | 18 | 240", "Mortero de 50 kg | 25 | 165", "Cemento gris de una tarima rota | 12 | 170"].join("\n");

export function CapturaTab() {
  const { db, capturar, toast } = useStore();
  const [vendedor, setVendedor] = useState("u19");
  const [catId, setCatId] = useState("obra-negra");
  const [subId, setSubId] = useState("cemento");
  const [cp, setCp] = useState("");
  const [texto, setTexto] = useState(EJEMPLO);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ publicados: number; sinCredito: number } | null>(null);
  const v = db?.usuarios.find((u) => u.id === vendedor);
  useEffect(() => {
    if (v) setCp(ubicacion(v.ubicacionId).cp);
  }, [vendedor]);
  const cat = db?.categorias.find((c) => c.id === catId);
  const sub = cat?.sub.find((s) => s.id === subId) ?? cat?.sub[0];
  const lugar = buscarCP(cp);
  const filas = useMemo(
    () =>
      texto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [t, c, p] = l.split(/\s*[|;]\s*/);
          const m = (c ?? "").match(/^(\d[\d,]*)\s*(.*)$/);
          const cantidad = m ? Number(m[1].replace(/,/g, "")) : NaN;
          const resto = (m?.[2] ?? "").toLowerCase().trim();
          const unidad = sub?.unidades.find((u) => resto && (resto === u || resto === u + "s" || resto === u + "es")) ?? sub?.unidades[0] ?? "pieza";
          const precio = Number((p ?? "").replace(/[^\d.]/g, ""));
          const ok = (t ?? "").length >= 6 && cantidad > 0 && precio > 0;
          return { raw: l, titulo: (t ?? "").trim(), cantidad, unidad, precio, ok };
        }),
    [texto, sub],
  );
  if (!db || !v) return null;
  const vendedores = db.usuarios.filter((u) => u.bienvenida !== "bloqueada");
  const validas = filas.filter((f) => f.ok);
  const disponibles = saldo(db, v.id);

  return (
    <div className="cards-wide" style={{ alignItems: "start" }}>
      <div className="card step stack">
        <div className="step-head" style={{ marginBottom: 0 }}>
          <ClipboardList size={20} color="var(--accent)" />
          <h3 className="h3">Captura asistida</h3>
        </div>
        <p className="small" style={{ color: "var(--ink-2)" }}>
          Para los primeros vendedores: mandan fotos y una lista por WhatsApp, y aquí se publica todo su patio de una vez, a su nombre y con sus créditos. Una línea por lote: qué es, cantidad y precio.
        </p>
        <div className="form-grid">
          <label className="field">
            <span>Vendedor</span>
            <select className="input" value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
              {vendedores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.negocio}
                </option>
              ))}
            </select>
            <small>
              {disponibles} {disponibles === 1 ? "crédito disponible" : "créditos disponibles"}
            </small>
          </label>
          <label className="field">
            <span>Categoría</span>
            <select
              className="input"
              value={catId}
              onChange={(e) => {
                setCatId(e.target.value);
                setSubId(db.categorias.find((c) => c.id === e.target.value)?.sub[0]?.id ?? "");
              }}
            >
              {db.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Subcategoría</span>
            <select className="input" value={sub?.id} onChange={(e) => setSubId(e.target.value)}>
              {cat?.sub.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Código postal del patio</span>
            <input className={`input ${lugar ? "" : "bad"}`} value={cp} inputMode="numeric" onChange={(e) => setCp(e.target.value.replace(/\D/g, "").slice(0, 5))} />
            <small>{lugar ? etiquetaLugar(lugar) : "Código no encontrado"}</small>
          </label>
        </div>
        <label className="field">
          <span>La lista que mandó</span>
          <textarea className="input" rows={6} value={texto} onChange={(e) => setTexto(e.target.value)} style={{ fontFamily: "inherit" }} />
        </label>
        <div className="photo-pick" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))" }}>
          {sub?.fotos.map((k) => (
            <button key={k} className="on" aria-label="Foto del vendedor">
              <img src={foto(k, 160, 160)} alt="" width={70} height={70} />
              <span className="ck">
                <ImagePlus size={12} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad stack">
        <h3 className="h3">Así quedarían</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lote</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{f.titulo || "Sin título"}</td>
                  <td className="num">{Number.isFinite(f.cantidad) ? `${numero(f.cantidad)} ${plural(f.unidad, f.cantidad)}` : "?"}</td>
                  <td className="num">{f.precio > 0 ? pesos(f.precio) : "?"}</td>
                  <td>{f.ok ? <Check size={16} color="var(--ok)" /> : <span className="badge err">Revisar</span>}</td>
                </tr>
              ))}
              {!filas.length && (
                <tr>
                  <td colSpan={4} className="muted">
                    {res ? "Todo lo de la lista ya quedó publicado." : "Pegue a la izquierda la lista que mandó el vendedor."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {validas.length > disponibles && (
          <div className="banner warn small">
            <Store size={16} />
            <span>
              Son {validas.length} lotes y {v.negocio} tiene {disponibles} {disponibles === 1 ? "crédito" : "créditos"}. Se publican los que alcancen y el resto queda en la lista.
            </span>
          </div>
        )}
        {res && (
          <div className="banner ok small">
            <CheckCircle2 size={16} />
            <span>
              Se publicaron {res.publicados} {res.publicados === 1 ? "lote" : "lotes"} a nombre de {v.negocio}.{res.sinCredito > 0 ? ` ${res.sinCredito} quedaron pendientes por falta de créditos.` : ""}{" "}
              <Link href="/buscar" style={{ textDecoration: "underline" }}>
                Verlos en la búsqueda
              </Link>
            </span>
          </div>
        )}
        <button
          className="btn btn-primary"
          disabled={!validas.length || !lugar || busy}
          onClick={async () => {
            if (!lugar || !sub) return;
            setBusy(true);
            const r = await capturar(v.id, sub.id, lugar.id, validas.map(({ titulo, cantidad, unidad, precio }) => ({ titulo, cantidad, unidad, precio })));
            setBusy(false);
            setRes(r);
            // lo publicado sale de la lista; lo que no alcanzó o hay que revisar se queda
            setTexto([...validas.slice(r.publicados), ...filas.filter((f) => !f.ok)].map((f) => f.raw).join("\n"));
            toast(`Listo: ${r.publicados} ${r.publicados === 1 ? "lote publicado" : "lotes publicados"} a nombre de ${v.negocio}.`);
          }}
        >
          {busy ? <Spin /> : <MessageCircle size={17} />} {validas.length ? `Publicar ${validas.length} ${validas.length === 1 ? "lote" : "lotes"} a nombre de ${v.negocio}` : "Nada pendiente en la lista"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- tablero del mes

export function TableroTab() {
  const { db } = useStore();
  const datos = useMemo(() => {
    if (!db) return null;
    const vendedores = db.usuarios.filter((u) => u.bienvenida === "otorgada" && diasEntre(u.registradoEl, db.hoy) > 30);
    const pagaron = vendedores.filter((u) => db.lotes.some((l) => l.usuarioId === u.id && l.origen === "compra"));
    const horas = db.anuncios
      .map((a) => a.primerContactoHoras)
      .filter((h): h is number => typeof h === "number")
      .sort((a, b) => a - b);
    const mediana = horas.length ? horas[Math.floor(horas.length / 2)] : null;
    const fallidas = [...db.busquedasFallidas]
      .sort((a, b) => b.veces - a.veces)
      .map((f) => {
        const r = buscar(db, { ...FILTROS_VACIOS, q: f.termino }, ubicacion(f.ubicacionId), null, false);
        return { ...f, hoy: r.resultados[0]?.km ?? null };
      });
    const zonas = ZONAS.map((z) => ({ ...z, ...llenadoZona(db, z.centro) })).sort((a, b) => b.anuncios - a.anuncios);
    return { vendedores, pagaron, mediana, fallidas, zonas, vecesFallidas: db.busquedasFallidas.reduce((s, f) => s + f.veces, 0) };
  }, [db]);
  if (!db || !datos) return null;
  const maxZona = Math.max(1, ...datos.zonas.map((z) => z.anuncios));
  const pct = datos.vendedores.length ? Math.round((datos.pagaron.length / datos.vendedores.length) * 100) : 0;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h3 className="h3">Los tres números del mes</h3>
        <p className="muted small">Lo que revisaríamos juntos cada mes, como el tablero de avance de una obra.</p>
      </div>
      <div className="kpis">
        <div className="card kpi">
          <div className="l">
            <Users size={15} /> Pagaron después del regalo
          </div>
          <div className="v">{pct}%</div>
          <div className="s">
            {datos.pagaron.length} de {datos.vendedores.length} vendedores ya compraron su siguiente crédito. Es la salud real del negocio.
          </div>
        </div>
        <div className="card kpi">
          <div className="l">
            <Timer size={15} /> Primer mensaje
          </div>
          <div className="v">{datos.mediana !== null ? `${datos.mediana} h` : "Sin datos"}</div>
          <div className="s">La mitad de los anuncios recibe su primer WhatsApp antes de ese tiempo.</div>
        </div>
        <div className="card kpi">
          <div className="l">
            <SearchX size={15} /> Buscaron y no había cerca
          </div>
          <div className="v">{numero(datos.vecesFallidas)}</div>
          <div className="s">{datos.fallidas.length} materiales distintos. Abajo, la lista de a quién salir a buscar.</div>
        </div>
        <div className="card kpi">
          <div className="l">
            <BellPlus size={15} /> Compradores esperando
          </div>
          <div className="v">{db.alertas.length}</div>
          <div className="s">{db.etapa2.alertas ? "alertas activas por correo" : "se activan con las alertas de la segunda etapa"}</div>
        </div>
      </div>

      <div className="cards-wide" style={{ alignItems: "start" }}>
        <div className="card card-pad">
          <h3 className="h3">Lo que la gente buscó y no encontró</h3>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Cada fila es material que alguien fue a buscar y se regresó con las manos vacías. Ahí está la lista de vendedores que conviene salir a buscar.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Buscó</th>
                  <th>Desde</th>
                  <th className="num">Veces</th>
                  <th>Hoy lo más cercano</th>
                </tr>
              </thead>
              <tbody>
                {datos.fallidas.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 800 }}>{f.termino}</td>
                    <td className="small">{etiquetaLugar(ubicacion(f.ubicacionId))}</td>
                    <td className="num">{f.veces}</td>
                    <td className="small">{f.hoy === null ? <span className="badge err">Nada en el sitio</span> : textoDistancia(f.hoy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="h3">Qué tan lleno está el tianguis</h3>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Anuncios activos a menos de 60 km del centro de cada zona. Donde está lleno, la gente vuelve; donde hay pocos puestos, conviene concentrar la búsqueda de vendedores antes de anunciar.
          </p>
          <div className="stack" style={{ gap: 10 }}>
            {datos.zonas.map((z) => {
              const estado = z.anuncios >= 12 ? ["Lleno", "ok"] : z.anuncios >= 5 ? ["A medias", "warn"] : ["Pocos puestos", "err"];
              return (
                <div key={z.id}>
                  <div className="row small" style={{ fontWeight: 800 }}>
                    <span style={{ flex: 1 }}>{z.nombre}</span>
                    <span className={`badge ${estado[1]}`}>{estado[0]}</span>
                  </div>
                  <div className="row small" style={{ gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 10, borderRadius: 999, background: "var(--bg-2)", overflow: "hidden" }}>
                      <div style={{ width: `${(z.anuncios / maxZona) * 100}%`, height: "100%", borderRadius: 999, background: "var(--accent)", transition: "width .6s" }} />
                    </div>
                    <span className="muted" style={{ minWidth: 150, textAlign: "right" }}>
                      {z.anuncios} {z.anuncios === 1 ? "anuncio" : "anuncios"} · {z.vendedores} {z.vendedores === 1 ? "vendedor" : "vendedores"} · {z.fallidas} sin resultado
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="muted small" style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Layers3 size={14} /> Al cierre de {fechaCorta(db.hoy)}
      </div>
    </div>
  );
}
