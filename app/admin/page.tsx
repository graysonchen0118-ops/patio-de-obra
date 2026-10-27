"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Palette, Layers3, ClipboardList, CalendarClock, FastForward, RotateCcw, Save, Settings2, Tags, LayoutList, Users, BarChart3, Plus, Trash2, Ban, Play, Eye, ShieldAlert, BadgeCheck, Coins, Clock3, Gift } from "lucide-react";
import type { CampoPersonalizado, Paquete, Reglas, TipoCampo } from "@/lib/types";
import { useStore } from "@/lib/store";
import { saldo, delLote } from "@/lib/engine";
import { ubicacion, etiquetaLugar, UBICACIONES } from "@/lib/geo";
import { foto } from "@/lib/photos";
import { diasEntre, enmascararTel, fechaCorta, fechaDia, pesos, sumarDias, sumarMeses, numero } from "@/lib/format";
import { Avatar, Empty, Spin } from "@/components/ui";
import { CapturaTab, EtapasTab, MarcaTab, TableroTab } from "@/components/AdminExtra";

function ReglasTab() {
  const { db, guardarReglas, avanzar, reiniciar } = useStore();
  const [r, setR] = useState<Reglas | null>(db ? { ...db.reglas } : null);
  const [pqs, setPqs] = useState<Paquete[]>(db ? db.paquetes.map((p) => ({ ...p })) : []);
  const [busy, setBusy] = useState<string | null>(null);
  if (!db || !r) return null;

  const campo = (k: keyof Reglas, etq: string, sufijo: string, ayuda?: string) => (
    <label className="field">
      <span>{etq}</span>
      <div className="row" style={{ gap: 8 }}>
        <input className="input" style={{ maxWidth: 110 }} inputMode="numeric" value={r[k]} onChange={(e) => setR({ ...r, [k]: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
        <span className="muted small" style={{ fontWeight: 700 }}>
          {sufijo}
        </span>
      </div>
      {ayuda && <small>{ayuda}</small>}
    </label>
  );

  // lo que va a pasar en los próximos días, para saber cuánto adelantar
  const proximos = [
    ...db.lotes.filter((l) => l.restantes > 0 && l.venceEl >= db.hoy).map((l) => ({ fecha: sumarDias(l.venceEl, 1), texto: `${l.restantes === 1 ? "Vence" : "Vencen"} ${l.restantes} ${delLote(l)} de ${db.usuarios.find((u) => u.id === l.usuarioId)?.nombre}` })),
    ...db.anuncios.filter((a) => (a.estado === "activo" || a.estado === "agotado") && a.venceEl >= db.hoy).map((a) => ({ fecha: sumarDias(a.venceEl, 1), texto: `Sale de las búsquedas: ${a.titulo}` })),
  ]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 7);

  const eventos = [...db.eventos].reverse().slice(0, 30);
  const mover = async (k: string, dias: number) => {
    setBusy(k);
    await avanzar(dias);
    setBusy(null);
  };
  const seisMeses = diasEntre(db.hoy, sumarMeses(db.hoy, 6));

  return (
    <div className="cards-wide" style={{ alignItems: "start" }}>
      <div className="card step stack">
        <div className="step-head" style={{ marginBottom: 4 }}>
          <Settings2 size={20} color="var(--sup)" />
          <h3 className="h3">Reglas de créditos y vigencia</h3>
        </div>
        <div className="form-grid">
          {campo("bienvenidaCreditos", "Crédito de bienvenida", "créditos", "Uno por número de WhatsApp confirmado.")}
          {campo("bienvenidaDias", "El regalo vence a los", "días")}
          {campo("compraMeses", "Créditos comprados vencen a los", "meses", "Contados desde la compra de cada paquete.")}
          {campo("anuncioDias", "Cada anuncio dura", "días")}
          {campo("renovacionCreditos", "Renovar un anuncio cuesta", "créditos", "Suma los días a lo que le quede.")}
          {campo("avisoCreditoDias", "Avisar créditos por vencer", "días antes")}
          {campo("avisoAnuncioDias", "Avisar anuncio por vencer", "días antes")}
          {campo("minResultados", "Ampliar la búsqueda si hay menos de", "anuncios")}
        </div>
        <div>
          <div className="field" style={{ marginBottom: 8 }}>
            <span>Paquetes</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Paquete</th>
                  <th className="num">Créditos</th>
                  <th className="num">Precio MXN</th>
                  <th className="num">Por anuncio</th>
                </tr>
              </thead>
              <tbody>
                {pqs.map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.nombre}</b>
                    </td>
                    <td className="num">{p.creditos}</td>
                    <td className="num">
                      <input
                        className="input"
                        style={{ width: 100, minHeight: 36, textAlign: "right" }}
                        value={p.precio}
                        inputMode="numeric"
                        onChange={(e) => {
                          const x = [...pqs];
                          x[i] = { ...p, precio: Number(e.target.value.replace(/\D/g, "")) || 0 };
                          setPqs(x);
                        }}
                      />
                    </td>
                    <td className="num">{pesos(Math.round((p.precio / p.creditos) * 100) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button
            className="btn btn-primary"
            disabled={busy === "reglas"}
            onClick={async () => {
              setBusy("reglas");
              await guardarReglas(r, pqs);
              setBusy(null);
            }}
          >
            {busy === "reglas" ? <Spin /> : <Save size={17} />} Guardar reglas
          </button>
        </div>
      </div>

      <div className="stack">
        <div className="card step stack">
          <div className="step-head" style={{ marginBottom: 0 }}>
            <CalendarClock size={20} color="var(--accent)" />
            <h3 className="h3">Probar los vencimientos</h3>
          </div>
          <p className="small" style={{ color: "var(--ink-2)" }}>
            Adelante el calendario y vea qué hace el sitio cada día: créditos que vencen, anuncios que salen de la búsqueda y avisos que se mandan. Todo el sitio se mueve a la nueva fecha.
          </p>
          <div className="card" style={{ padding: "14px 16px", background: "var(--surface-2)" }}>
            <div className="muted small" style={{ fontWeight: 800 }}>
              Fecha del sitio
            </div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{fechaDia(db.hoy)}</div>
            {db.hoy !== db.hoyReal && <div className="small" style={{ color: "var(--accent)", fontWeight: 800 }}>{diasEntre(db.hoyReal, db.hoy)} días adelante de hoy</div>}
          </div>
          <div className="wrap-row">
            {(
              [
                ["d1", "+1 día", 1],
                ["d7", "+7 días", 7],
                ["d30", "+30 días", 30],
                ["m6", "+6 meses", seisMeses],
              ] as const
            ).map(([k, l, n]) => (
              <button key={k} className="btn btn-sm btn-dark" disabled={!!busy} onClick={() => mover(k, n)}>
                {busy === k ? <Spin /> : <FastForward size={15} />} {l}
              </button>
            ))}
            <button className="btn btn-sm" onClick={reiniciar}>
              <RotateCcw size={15} /> Volver a hoy
            </button>
          </div>
          <div>
            <b className="small">Lo que viene</b>
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              {proximos.map((p, i) => (
                <div key={i} className="row small" style={{ alignItems: "flex-start" }}>
                  <span className="badge sup" style={{ minWidth: 64, justifyContent: "center" }}>
                    {fechaCorta(p.fecha)}
                  </span>
                  <span>{p.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card step">
          <b className="small">Lo que ya pasó</b>
          <div className="stack" style={{ gap: 6, marginTop: 10, maxHeight: 300, overflow: "auto" }}>
            {eventos.length === 0 && <p className="muted small">Todavía no adelanta el calendario.</p>}
            {eventos.map((e) => (
              <div key={e.id} className="row small" style={{ alignItems: "flex-start" }}>
                <span className={`badge ${e.tipo === "vence-credito" ? "err" : e.tipo === "vence-anuncio" ? "warn" : ""}`} style={{ minWidth: 64, justifyContent: "center" }}>
                  {fechaCorta(e.fecha)}
                </span>
                <span>{e.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Categorias() {
  const { db, agregarCampo, quitarCampo, agregarSub } = useStore();
  const [catId, setCatId] = useState("obra-negra");
  const [subId, setSubId] = useState("cemento");
  const [nuevo, setNuevo] = useState<{ etiqueta: string; tipo: TipoCampo; opciones: string; requerido: boolean }>({ etiqueta: "", tipo: "lista", opciones: "", requerido: false });
  const [nuevaSub, setNuevaSub] = useState({ nombre: "", unidad: "pieza" });
  const [busy, setBusy] = useState(false);
  if (!db) return null;
  const cat = db.categorias.find((c) => c.id === catId)!;
  const sub = cat.sub.find((s) => s.id === subId) ?? cat.sub[0];
  const usados = (sid: string) => db.anuncios.filter((a) => a.subId === sid).length;

  return (
    <div className="cards-wide" style={{ alignItems: "start", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
      <div className="card card-pad">
        <h3 className="h3" style={{ marginBottom: 12 }}>
          Árbol de categorías
        </h3>
        <div className="stack" style={{ gap: 10 }}>
          {db.categorias.map((c) => (
            <div key={c.id}>
              <button className={`chip ${c.id === catId ? "on" : ""}`} onClick={() => { setCatId(c.id); setSubId(c.sub[0]?.id ?? ""); }}>
                {c.nombre} <span className="n">{c.sub.length}</span>
              </button>
              {c.id === catId && (
                <div className="stack" style={{ gap: 4, margin: "8px 0 0 14px" }}>
                  {c.sub.map((s) => (
                    <button key={s.id} className={`pick ${s.id === sub?.id ? "on" : ""}`} style={{ padding: "8px 12px", flexDirection: "row", justifyContent: "space-between", fontWeight: 700 }} onClick={() => setSubId(s.id)}>
                      <span>{s.nombre}</span>
                      <span className="muted small">
                        {s.campos.length} campos · {usados(s.id)} anuncios
                      </span>
                    </button>
                  ))}
                  <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
                    <input className="input" style={{ flex: "1 1 160px", minHeight: 38 }} placeholder="Nueva subcategoría" value={nuevaSub.nombre} onChange={(e) => setNuevaSub({ ...nuevaSub, nombre: e.target.value })} />
                    <input className="input" style={{ width: 90, minHeight: 38 }} placeholder="unidad" value={nuevaSub.unidad} onChange={(e) => setNuevaSub({ ...nuevaSub, unidad: e.target.value })} />
                    <button
                      className="btn btn-sm"
                      disabled={nuevaSub.nombre.trim().length < 3 || busy}
                      onClick={async () => {
                        setBusy(true);
                        await agregarSub(c.id, nuevaSub.nombre.trim(), nuevaSub.unidad.trim() || "pieza");
                        setNuevaSub({ nombre: "", unidad: "pieza" });
                        setBusy(false);
                      }}
                    >
                      <Plus size={15} /> Agregar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {sub && (
        <div className="card card-pad stack">
          <div>
            <div className="eyebrow">{cat.nombre}</div>
            <h3 className="h3" style={{ marginTop: 4 }}>
              Campos de {sub.nombre.toLowerCase()}
            </h3>
            <p className="muted small">Se venden por: {sub.unidades.join(", ")}. Los campos aparecen al publicar y en la ficha del anuncio.</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>Opciones</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sub.campos.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>{c.etiqueta}</b> {c.requerido && <span className="badge acc">Obligatorio</span>}
                    </td>
                    <td>{c.tipo === "lista" ? "Lista" : c.tipo === "numero" ? "Número" : "Texto"}</td>
                    <td className="small muted">{c.opciones?.join(", ") ?? "Libre"}</td>
                    <td className="num">
                      <button className="icon-btn" aria-label="Quitar campo" onClick={() => quitarCampo(cat.id, sub.id, c.id)}>
                        <Trash2 size={16} color="var(--err)" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!sub.campos.length && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Sin campos todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="card" style={{ padding: 14, background: "var(--surface-2)" }}>
            <b className="small">Agregar campo</b>
            <div className="form-grid" style={{ marginTop: 10 }}>
              <input className="input" placeholder="Nombre del campo, ej. Marca" value={nuevo.etiqueta} onChange={(e) => setNuevo({ ...nuevo, etiqueta: e.target.value })} />
              <select className="input" value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value as TipoCampo })}>
                <option value="lista">Lista de opciones</option>
                <option value="texto">Texto libre</option>
                <option value="numero">Número</option>
              </select>
            </div>
            {nuevo.tipo === "lista" && <input className="input" style={{ marginTop: 10 }} placeholder="Opciones separadas por coma" value={nuevo.opciones} onChange={(e) => setNuevo({ ...nuevo, opciones: e.target.value })} />}
            <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
              <label className="toggle small">
                <input type="checkbox" checked={nuevo.requerido} onChange={(e) => setNuevo({ ...nuevo, requerido: e.target.checked })} />
                <span className="sw" />
                <span>Obligatorio</span>
              </label>
              <span className="spacer" />
              <button
                className="btn btn-sm btn-dark"
                disabled={nuevo.etiqueta.trim().length < 2 || (nuevo.tipo === "lista" && nuevo.opciones.split(",").filter((x) => x.trim()).length < 2)}
                onClick={async () => {
                  const c: CampoPersonalizado = {
                    id: `${nuevo.etiqueta.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")}-${Date.now() % 10000}`,
                    etiqueta: nuevo.etiqueta.trim(),
                    tipo: nuevo.tipo,
                    requerido: nuevo.requerido,
                    opciones: nuevo.tipo === "lista" ? nuevo.opciones.split(",").map((x) => x.trim()).filter(Boolean) : undefined,
                  };
                  await agregarCampo(cat.id, sub.id, c);
                  setNuevo({ etiqueta: "", tipo: "lista", opciones: "", requerido: false });
                }}
              >
                <Plus size={15} /> Agregar campo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const POR_PAG = 15;

function Anuncios() {
  const { db, cambiarEstado, toast } = useStore();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [edo, setEdo] = useState("");
  const [pag, setPag] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const estados = useMemo(() => Array.from(new Set(UBICACIONES.map((u) => u.estado))).sort(), []);
  if (!db) return null;
  const lista = db.anuncios
    .filter((a) => (!estado || a.estado === estado) && (!edo || ubicacion(a.ubicacionId).estado === edo) && (!q || `${a.titulo} ${a.id}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.publicadoEl.localeCompare(a.publicadoEl));
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAG));
  const ver = lista.slice((pag - 1) * POR_PAG, pag * POR_PAG);
  const etq: Record<string, string> = { activo: "ok", agotado: "warn", vencido: "err", pausado: "", suspendido: "err" };

  return (
    <div className="stack">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <input className="input" style={{ flex: "1 1 220px", maxWidth: 320 }} placeholder="Buscar por título o folio" value={q} onChange={(e) => { setQ(e.target.value); setPag(1); }} />
        <select className="input" style={{ width: "auto" }} value={estado} onChange={(e) => { setEstado(e.target.value); setPag(1); }}>
          <option value="">Todos los estados del anuncio</option>
          {["activo", "agotado", "pausado", "vencido", "suspendido"].map((x) => (
            <option key={x} value={x}>
              {x.charAt(0).toUpperCase() + x.slice(1)}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: "auto" }} value={edo} onChange={(e) => { setEdo(e.target.value); setPag(1); }}>
          <option value="">Toda la república</option>
          {estados.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <span className="muted small" style={{ fontWeight: 700 }}>
          {lista.length} anuncios
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Anuncio</th>
              <th>Vendedor</th>
              <th>Lugar</th>
              <th>Estado</th>
              <th>Vence</th>
              <th className="num">WhatsApp</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ver.map((a) => {
              const v = db.usuarios.find((u) => u.id === a.vendedorId);
              return (
                <tr key={a.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <img src={foto(a.fotos[0], 120, 90)} alt="" width={52} height={40} style={{ width: 52, height: 40, objectFit: "cover", borderRadius: 8 }} />
                      <div style={{ minWidth: 0 }}>
                        <Link href={`/anuncio/${a.id}`} style={{ fontWeight: 800 }}>
                          {a.titulo}
                        </Link>
                        <div className="muted small">
                          {a.id} · {pesos(a.precio)} / {a.unidad}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="small">{v?.negocio}</td>
                  <td className="small">{etiquetaLugar(ubicacion(a.ubicacionId))}</td>
                  <td>
                    <span className={`badge ${etq[a.estado]}`}>{a.estado}</span>
                  </td>
                  <td className="small" style={{ whiteSpace: "nowrap" }}>
                    {fechaCorta(a.venceEl)}
                  </td>
                  <td className="num">{a.contactos}</td>
                  <td className="num">
                    {a.estado === "suspendido" ? (
                      <button
                        className="btn btn-sm"
                        disabled={busy === a.id}
                        onClick={async () => {
                          setBusy(a.id);
                          await cambiarEstado(a.id, a.venceEl < db.hoy ? "vencido" : a.cantidad > 0 ? "activo" : "agotado");
                          setBusy(null);
                          toast("Anuncio reactivado.");
                        }}
                      >
                        <Play size={14} /> Reactivar
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={busy === a.id}
                        onClick={async () => {
                          setBusy(a.id);
                          await cambiarEstado(a.id, "suspendido");
                          setBusy(null);
                          toast("Anuncio suspendido. Ya no aparece en búsquedas.", "info");
                        }}
                      >
                        <Ban size={14} /> Suspender
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!ver.length && <Empty icon={<LayoutList size={26} />} title="Sin anuncios con esos filtros" />}
      </div>
      {paginas > 1 && (
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn btn-sm" disabled={pag === 1} onClick={() => setPag(pag - 1)}>
            Anterior
          </button>
          <span className="small" style={{ fontWeight: 800 }}>
            {pag} de {paginas}
          </span>
          <button className="btn btn-sm" disabled={pag === paginas} onClick={() => setPag(pag + 1)}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function Usuarios() {
  const { db, verComo } = useStore();
  const router = useRouter();
  if (!db) return null;
  const lista = [...db.usuarios].sort((a, b) => b.registradoEl.localeCompare(a.registradoEl));
  const bloqueados = lista.filter((u) => u.bienvenida === "bloqueada").length;
  return (
    <div className="stack">
      {bloqueados > 0 && (
        <div className="banner warn">
          <ShieldAlert size={18} />
          <span>
            <b>{bloqueados} cuentas</b> se registraron con un WhatsApp que ya había recibido el regalo. Las cuentas existen y pueden comprar créditos; el crédito de bienvenida no se repitió.
          </span>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Tipo</th>
              <th>Lugar</th>
              <th>WhatsApp</th>
              <th>Bienvenida</th>
              <th className="num">Créditos</th>
              <th className="num">Anuncios</th>
              <th>Alta</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} style={u.id === db.usuarioId ? { background: "var(--accent-soft)" } : undefined}>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar foto={u.foto} size={34} alt={u.nombre} />
                    <div>
                      <b>{u.nombre}</b>
                      <div className="muted small">{u.negocio}</div>
                    </div>
                  </div>
                </td>
                <td className="small">{u.tipo}</td>
                <td className="small">{etiquetaLugar(ubicacion(u.ubicacionId))}</td>
                <td className="small" style={{ whiteSpace: "nowrap" }}>
                  <BadgeCheck size={13} color="var(--ok)" style={{ verticalAlign: -2 }} /> {enmascararTel(u.telefono)}
                </td>
                <td>{u.bienvenida === "otorgada" ? <span className="badge ok"><Gift size={12} /> Otorgada</span> : <span className="badge err"><ShieldAlert size={12} /> Número repetido</span>}</td>
                <td className="num">{saldo(db, u.id)}</td>
                <td className="num">{db.anuncios.filter((a) => a.vendedorId === u.id && a.estado === "activo").length}</td>
                <td className="small" style={{ whiteSpace: "nowrap" }}>
                  {fechaCorta(u.registradoEl)}
                </td>
                <td className="num">
                  {u.id === db.usuarioId ? (
                    <span className="badge acc">Viendo</span>
                  ) : (
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        verComo(u.id);
                        router.push("/panel");
                      }}
                    >
                      <Eye size={14} /> Ver como
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Ventas() {
  const { db } = useStore();
  if (!db) return null;
  const pagados = db.pagos.filter((p) => p.estado === "pagado");
  const ult30 = pagados.filter((p) => diasEntre(p.fecha, db.hoy) < 30);
  const vencidos = db.lotes.reduce((s, l) => s + l.vencidos, 0);
  const regaloSinUsar = db.lotes.filter((l) => l.origen === "bienvenida").reduce((s, l) => s + l.vencidos, 0);
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const fin = sumarDias(db.hoy, -7 * (7 - i));
    const ini = sumarDias(fin, -6);
    const ps = pagados.filter((p) => p.fecha >= ini && p.fecha <= fin);
    return { ini, fin, monto: ps.reduce((s, p) => s + p.monto, 0), creditos: ps.reduce((s, p) => s + p.creditos, 0), n: ps.length };
  });
  const max = Math.max(1, ...semanas.map((s) => s.monto));
  const metodo = { tarjeta: "Tarjeta", oxxo: "OXXO", spei: "SPEI" } as const;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="kpis">
        <div className="card kpi">
          <div className="l">
            <Coins size={15} /> Ventas últimos 30 días
          </div>
          <div className="v">{pesos(ult30.reduce((s, p) => s + p.monto, 0))}</div>
          <div className="s">{ult30.length} compras de paquetes</div>
        </div>
        <div className="card kpi">
          <div className="l">
            <BarChart3 size={15} /> Créditos vendidos
          </div>
          <div className="v">{numero(ult30.reduce((s, p) => s + p.creditos, 0))}</div>
          <div className="s">en los últimos 30 días</div>
        </div>
        <div className="card kpi">
          <div className="l">
            <Clock3 size={15} /> Vencieron sin usarse
          </div>
          <div className="v">{vencidos}</div>
          <div className="s">{regaloSinUsar} de ellos eran regalo de bienvenida</div>
        </div>
        <div className="card kpi">
          <div className="l">
            <LayoutList size={15} /> Anuncios activos
          </div>
          <div className="v">{db.anuncios.filter((a) => a.estado === "activo").length}</div>
          <div className="s">de {db.anuncios.length} publicados</div>
        </div>
      </div>
      <div className="cards-wide" style={{ alignItems: "start" }}>
        <div className="card card-pad">
          <h3 className="h3">Venta de créditos por semana</h3>
          <p className="muted small">Pesos cobrados, últimas 8 semanas</p>
          <div className="bars" style={{ marginTop: 14 }}>
            {semanas.map((s) => (
              <div key={s.ini} className="bar" style={{ height: `${(s.monto / max) * 100}%` }}>
                <span className="tip">
                  {fechaCorta(s.ini)} al {fechaCorta(s.fin)}: {pesos(s.monto)} · {s.creditos} créditos
                </span>
              </div>
            ))}
          </div>
          <div className="bar-labels">
            {semanas.map((s) => (
              <span key={s.ini}>{fechaCorta(s.fin)}</span>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <h3 className="h3" style={{ marginBottom: 10 }}>
            Últimos pagos
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cuenta</th>
                  <th>Forma</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {[...db.pagos]
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .slice(0, 10)
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="small">{fechaCorta(p.fecha)}</td>
                      <td className="small">{db.usuarios.find((u) => u.id === p.usuarioId)?.negocio}</td>
                      <td>
                        <span className={`badge ${p.estado === "pendiente" ? "warn" : ""}`}>{p.estado === "pendiente" ? `${metodo[p.metodo]} pendiente` : metodo[p.metodo]}</span>
                      </td>
                      <td className="num">{pesos(p.monto)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Admin() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = sp.get("tab") ?? "reglas";
  const { db } = useStore();
  if (!db) return <div className="page wrap" />;
  const tabs = [
    ["reglas", "Reglas y calendario", CalendarClock],
    ["marca", "Marca", Palette],
    ["etapas", "Etapas", Layers3],
    ["captura", "Captura asistida", ClipboardList],
    ["tablero", "Tablero del mes", BarChart3],
    ["categorias", "Categorías", Tags],
    ["anuncios", "Anuncios", LayoutList],
    ["usuarios", "Usuarios", Users],
  ] as const;
  return (
    <div className="page">
      <div className="wrap">
        <div className="eyebrow">Administración</div>
        <h1 className="h2" style={{ marginTop: 6, marginBottom: 18 }}>
          {db.marca.nombre} por dentro
        </h1>
        <div className="tabs" role="tablist">
          {tabs.map(([k, l, I]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => router.replace(`/admin?tab=${k}`, { scroll: false })}>
              <I size={16} /> {l}
            </button>
          ))}
        </div>
        {tab === "reglas" && <ReglasTab />}
        {tab === "categorias" && <Categorias />}
        {tab === "anuncios" && <Anuncios />}
        {tab === "usuarios" && <Usuarios />}
        {tab === "marca" && <MarcaTab />}
        {tab === "etapas" && <EtapasTab />}
        {tab === "captura" && <CapturaTab />}
        {(tab === "tablero" || tab === "ventas") && (
          <div className="stack" style={{ gap: 28 }}>
            <TableroTab />
            <Ventas />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="page wrap" />}>
      <Admin />
    </Suspense>
  );
}
