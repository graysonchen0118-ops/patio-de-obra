"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Coins, Eye, LayoutList, MessageCircle, Minus, Pause, Pencil, Play, Plus, RefreshCw, Trash2, Clock3, PackageX, CalendarRange, ArrowUpRight, Gift, ShoppingBag, CheckCircle2, Hourglass, PlusCircle, Store } from "lucide-react";
import type { Anuncio, LoteCreditos } from "@/lib/types";
import { useStore } from "@/lib/store";
import { estadoLote, lotesEnOrden, saldo, delLote } from "@/lib/engine";
import { foto } from "@/lib/photos";
import { cantidadUnidad, diasEntre, faltan, fechaCorta, fechaLarga, pesos, numero, plural } from "@/lib/format";
import { Empty, Modal, Spin, Avatar } from "@/components/ui";
import BuyCredits from "@/components/BuyCredits";
import { Fichas, Pila } from "@/components/three/Scenes";
import { tipoPila } from "@/components/three/StackScene";

type Filtro = "todos" | "activos" | "pronto" | "agotados" | "vencidos" | "pausados";

const ETQ_ESTADO: Record<Anuncio["estado"], [string, string]> = {
  activo: ["Activo", "ok"],
  agotado: ["Sin existencias", "warn"],
  pausado: ["Pausado", ""],
  vencido: ["Vencido", "err"],
  suspendido: ["Suspendido", "err"],
};

function FilaAnuncio({ a, sel, onSel }: { a: Anuncio; sel: boolean; onSel: () => void }) {
  const { db, actualizarCantidad, renovar, cambiarEstado, eliminarAnuncio } = useStore();
  const [qty, setQty] = useState(String(a.cantidad));
  const [busy, setBusy] = useState<string | null>(null);
  const [borrar, setBorrar] = useState(false);
  useEffect(() => setQty(String(a.cantidad)), [a.cantidad]);
  if (!db) return null;
  const dias = diasEntre(db.hoy, a.venceEl);
  const pct = Math.max(0, Math.min(100, (dias / db.reglas.anuncioDias) * 100));
  const [etq, tono] = ETQ_ESTADO[a.estado];
  const cambiado = qty !== String(a.cantidad) && qty !== "";
  const hacer = async (k: string, fn: () => Promise<unknown>) => {
    setBusy(k);
    await fn();
    setBusy(null);
  };

  return (
    <div className={`card mine ${sel ? "sel" : ""}`} onClick={onSel} data-fila={a.id}>
      <img src={foto(a.fotos[0], 240, 200)} alt="" width={96} height={80} />
      <div style={{ minWidth: 0 }}>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          <span className={`badge ${tono}`}>{etq}</span>
          {a.estado === "activo" && dias <= db.reglas.avisoAnuncioDias && <span className="badge warn">Vence pronto</span>}
          <span className="muted small">{a.id}</span>
        </div>
        <Link href={`/anuncio/${a.id}`} onClick={(e) => e.stopPropagation()} style={{ fontWeight: 800, display: "block", marginTop: 4, lineHeight: 1.3 }}>
          {a.titulo}
        </Link>
        <div className="small muted" style={{ marginTop: 2, fontWeight: 700 }}>
          {pesos(a.precio)} / {a.unidad} · <Eye size={12} style={{ verticalAlign: -1 }} /> {numero(a.vistas)} · <MessageCircle size={12} style={{ verticalAlign: -1 }} /> {a.contactos} por WhatsApp
        </div>
        <div className={`vig ${a.estado === "vencido" ? "err" : dias <= db.reglas.avisoAnuncioDias ? "warn" : ""}`}>
          <i style={{ width: `${a.estado === "vencido" ? 100 : pct}%` }} />
        </div>
        <div className="small" style={{ marginTop: 4, color: "var(--ink-2)", fontWeight: 700 }}>
          {a.estado === "vencido" ? `Venció el ${fechaCorta(a.venceEl)}` : `Vigente hasta el ${fechaCorta(a.venceEl)} · ${faltan(a.venceEl, db.hoy)}`}
        </div>
        <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
          <div className="qty">
            <button onClick={() => setQty(String(Math.max(0, Number(qty || 0) - (a.minimo ?? 1))))} aria-label="Menos">
              <Minus size={15} />
            </button>
            <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} aria-label="Cantidad" />
            <button onClick={() => setQty(String(Number(qty || 0) + (a.minimo ?? 1)))} aria-label="Más">
              <Plus size={15} />
            </button>
          </div>
          <span className="small muted">{plural(a.unidad, 2)}</span>
          {cambiado && (
            <button className="btn btn-sm btn-dark" disabled={!!busy} onClick={() => hacer("qty", () => actualizarCantidad(a.id, Number(qty)))}>
              {busy === "qty" ? <Spin /> : null} Guardar cantidad
            </button>
          )}
          {!cambiado && a.cantidad > 0 && (
            <button className="btn btn-sm btn-ghost" disabled={!!busy} onClick={() => hacer("cero", () => actualizarCantidad(a.id, 0))}>
              <PackageX size={15} /> Ya se vendió todo
            </button>
          )}
        </div>
      </div>
      <div className="mine-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-sm btn-primary" disabled={!!busy || a.estado === "suspendido"} onClick={() => hacer("ren", () => renovar(a.id))} title={`Suma ${db.reglas.anuncioDias} días a lo que le queda`}>
          {busy === "ren" ? <Spin /> : <RefreshCw size={15} />} Renovar
        </button>
        {a.estado === "pausado" ? (
          <button className="btn btn-sm" disabled={!!busy} onClick={() => hacer("est", () => cambiarEstado(a.id, a.cantidad > 0 ? "activo" : "agotado"))}>
            <Play size={15} /> Reactivar
          </button>
        ) : (
          a.estado === "activo" && (
            <button className="btn btn-sm" disabled={!!busy} onClick={() => hacer("est", () => cambiarEstado(a.id, "pausado"))}>
              <Pause size={15} /> Pausar
            </button>
          )
        )}
        <Link href={`/publicar?editar=${a.id}`} className="btn btn-sm">
          <Pencil size={15} /> Editar
        </Link>
        <button className="btn btn-sm btn-danger" onClick={() => setBorrar(true)}>
          <Trash2 size={15} /> Eliminar
        </button>
      </div>
      <Modal
        open={borrar}
        onClose={() => setBorrar(false)}
        title="Eliminar anuncio"
        icon={<Trash2 size={19} color="var(--err)" />}
        foot={
          <>
            <button className="btn" onClick={() => setBorrar(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-danger"
              disabled={!!busy}
              onClick={async () => {
                setBusy("del");
                await eliminarAnuncio(a.id);
              }}
            >
              {busy === "del" ? <Spin /> : <Trash2 size={15} />} Eliminar
            </button>
          </>
        }
      >
        <p>
          Se borra <b>{a.titulo}</b> y deja de aparecer. El crédito que usó no se devuelve. Si solo se le acabó el material, mejor ponga la cantidad en cero: el anuncio se pausa y lo puede reactivar sin gastar otro crédito.
        </p>
      </Modal>
    </div>
  );
}

function Anuncios() {
  const { db, yo } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [sel, setSel] = useState<string | null>(null);
  if (!db || !yo) return null;
  const mios = db.anuncios.filter((a) => a.vendedorId === yo.id);
  const cuenta = (f: Filtro) => mios.filter((a) => pasa(a, f)).length;
  function pasa(a: Anuncio, f: Filtro) {
    if (!db) return false;
    if (f === "activos") return a.estado === "activo";
    if (f === "pronto") return a.estado === "activo" && diasEntre(db.hoy, a.venceEl) <= db.reglas.avisoAnuncioDias;
    if (f === "agotados") return a.estado === "agotado";
    if (f === "vencidos") return a.estado === "vencido";
    if (f === "pausados") return a.estado === "pausado" || a.estado === "suspendido";
    return true;
  }
  const lista = mios.filter((a) => pasa(a, filtro)).sort((a, b) => a.venceEl.localeCompare(b.venceEl));
  const elegido = mios.find((a) => a.id === sel) ?? lista[0] ?? mios[0];

  return (
    <div className="panel-grid">
      <div>
        <div className="wrap-row" style={{ marginBottom: 14 }}>
          {(
            [
              ["todos", "Todos"],
              ["activos", "Activos"],
              ["pronto", "Vencen pronto"],
              ["agotados", "Sin existencias"],
              ["vencidos", "Vencidos"],
              ["pausados", "Pausados"],
            ] as [Filtro, string][]
          ).map(([k, l]) => (
            <button key={k} className={`chip ${filtro === k ? "on" : ""}`} onClick={() => setFiltro(k)}>
              {l} <span className="n">{cuenta(k)}</span>
            </button>
          ))}
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {lista.map((a) => (
            <FilaAnuncio key={a.id} a={a} sel={elegido?.id === a.id} onSel={() => setSel(a.id)} />
          ))}
          {!lista.length && (
            <Empty icon={<LayoutList size={28} />} title="Nada en este filtro" action={<Link href="/publicar" className="btn btn-primary"><PlusCircle size={17} /> Publicar anuncio</Link>}>
              {mios.length ? "Pruebe con otro filtro." : "Todavía no publica nada. Su primer anuncio puede salir del crédito de bienvenida."}
            </Empty>
          )}
        </div>
      </div>
      <aside className="sticky-side stack">
        {elegido && (
          <div className="card card-pad">
            <h3 className="h3">Existencia en patio</h3>
            <p className="muted small" style={{ marginTop: 2 }}>
              {elegido.titulo}
            </p>
            <div className="stack-box" style={{ marginTop: 12 }}>
              <Pila tipo={tipoPila(elegido.subId)} cantidad={elegido.cantidad} maximo={elegido.cantidadInicial} />
              <div className="stack-label">{elegido.cantidad === 0 ? "Sin existencias, anuncio pausado" : cantidadUnidad(elegido.cantidad, elegido.unidad)}</div>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              Cuando vende una parte, cambie la cantidad y la pila baja. En cero el anuncio se pausa solo para que nadie le escriba por algo que ya no tiene.
            </p>
          </div>
        )}
        <div className="card card-pad">
          <h3 className="h3">Vigencia de los anuncios</h3>
          <p className="small" style={{ marginTop: 6, color: "var(--ink-2)" }}>
            Cada anuncio dura {db.reglas.anuncioDias} días desde que se publica. {db.reglas.avisoAnuncioDias} días antes le avisamos. Renovar cuesta {db.reglas.renovacionCreditos} crédito y suma {db.reglas.anuncioDias} días a lo que le quede, así que renovar antes no le hace perder días.
          </p>
        </div>
      </aside>
    </div>
  );
}

const COLOR_ORIGEN: Record<LoteCreditos["origen"], string> = { bienvenida: "#2b5566", compra: "#c4532f", ajuste: "#8a7b5c" };

function Creditos() {
  const { db, yo, confirmarPago } = useStore();
  const [comprar, setComprar] = useState(false);
  const [pagando, setPagando] = useState<string | null>(null);
  if (!db || !yo) return null;
  const lotes = db.lotes.filter((l) => l.usuarioId === yo.id).sort((a, b) => b.creadoEl.localeCompare(a.creadoEl));
  const orden = lotesEnOrden(db, yo.id);
  const disponibles = saldo(db, yo.id);
  const siguiente = orden[0];
  const relevantes = [...orden, ...lotes.filter((l) => !orden.includes(l) && l.vencidos > 0 && diasEntre(l.venceEl, db.hoy) < 120)].slice(0, 5);
  const columnas = relevantes.map((l) => ({ id: l.id, restantes: l.restantes, vencidos: l.restantes === 0 ? l.vencidos : 0, origen: l.origen, siguiente: l.id === siguiente?.id }));
  const movs = db.movimientos.filter((m) => m.usuarioId === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id)).slice(0, 25);
  const pendientes = db.pagos.filter((p) => p.usuarioId === yo.id && p.estado === "pendiente");

  // línea de tiempo: de la compra más vieja vigente al vencimiento más lejano
  const enLinea = lotes.filter((l) => l.restantes > 0 || diasEntre(l.venceEl, db.hoy) < 60).slice(0, 6);
  const ini = enLinea.reduce((m, l) => (l.creadoEl < m ? l.creadoEl : m), db.hoy);
  const fin = enLinea.reduce((m, l) => (l.venceEl > m ? l.venceEl : m), db.hoy);
  const span = Math.max(1, diasEntre(ini, fin));
  const pos = (d: string) => `${(diasEntre(ini, d) / span) * 100}%`;
  const usados = (l: LoteCreditos) => l.cantidad - l.restantes - l.vencidos;
  const estadoEtq: Record<string, [string, string]> = { vigente: ["Vigente", "ok"], "por-vencer": ["Por vencer", "warn"], agotado: ["Usado completo", ""], vencido: ["Vencido", "err"] };

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="panel-grid">
        <div className="card card-pad">
          <div className="row" style={{ flexWrap: "wrap" }}>
            <div>
              <h3 className="h3">Sus créditos, por lote</h3>
              <p className="muted small">Cada columna es un lote con su propia fecha. La ficha que brilla es la siguiente que se usa.</p>
            </div>
            <span className="spacer" />
            <button className="btn btn-primary btn-sm" onClick={() => setComprar(true)}>
              <Coins size={15} /> Comprar créditos
            </button>
          </div>
          <div className="credit-scene" style={{ marginTop: 14 }}>
            <Fichas lotes={columnas} />
            {relevantes.map((l) => (
              <div key={l.id} className="lot-label" data-lote={l.id}>
                {l.nombre}
                <small>{l.restantes > 0 ? `${l.restantes} · vence ${fechaCorta(l.venceEl)}` : `vencido ${fechaCorta(l.venceEl)}`}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="card kpi">
            <div className="l">
              <Coins size={15} /> Disponibles hoy
            </div>
            <div className="v">{disponibles}</div>
            <div className="s">{orden.length} {orden.length === 1 ? "lote vigente" : "lotes vigentes"}</div>
          </div>
          <div className="card kpi">
            <div className="l">
              <Hourglass size={15} /> Se usan primero
            </div>
            <div className="v" style={{ fontSize: 20 }}>
              {siguiente ? `${siguiente.restantes} ${delLote(siguiente)}` : "Sin créditos"}
            </div>
            <div className="s">{siguiente ? `Vencen el ${fechaLarga(siguiente.venceEl)} (${faltan(siguiente.venceEl, db.hoy)})` : "Compre un paquete para publicar"}</div>
          </div>
          <div className="card card-pad small" style={{ color: "var(--ink-2)" }}>
            <b style={{ color: "var(--ink)" }}>Cómo vencen</b>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, display: "grid", gap: 6 }}>
              <li>Comprados: {db.reglas.compraMeses} meses desde la compra de cada paquete.</li>
              <li>Regalo de bienvenida: {db.reglas.bienvenidaDias} días desde que confirma su WhatsApp.</li>
              <li>Se gasta primero el lote que vence antes, para que nunca se le pierda lo pagado mientras le queda regalo.</li>
              <li>Vencen a las 23:59, hora del centro de México.</li>
            </ul>
          </div>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="stack" style={{ gap: 10 }}>
          {pendientes.map((p) => (
            <div key={p.id} className="banner warn">
              <Store size={18} />
              <span style={{ flex: 1 }}>
                Pago pendiente de {pesos(p.monto)} por {p.creditos} créditos, {p.metodo === "oxxo" ? "en OXXO" : "por SPEI"}, referencia <b>{p.referencia}</b>.
              </span>
              <button
                className="btn btn-sm btn-dark"
                disabled={pagando === p.id}
                onClick={async () => {
                  setPagando(p.id);
                  await confirmarPago(p.id);
                  setPagando(null);
                }}
              >
                {pagando === p.id ? <Spin /> : <CheckCircle2 size={15} />} Ya pagué, revisar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card card-pad">
        <div className="row" style={{ marginBottom: 18 }}>
          <CalendarRange size={18} color="var(--sup)" />
          <h3 className="h3">Línea de vencimientos</h3>
        </div>
        <div className="timeline">
          {enLinea.map((l) => (
            <div key={l.id} className="tl-row">
              <div>
                <b>{l.nombre}</b>
                <div className="muted small">
                  {fechaCorta(l.creadoEl)} al {fechaCorta(l.venceEl)}
                </div>
              </div>
              <div className="tl-track">
                <div className="tl-bar" style={{ left: pos(l.creadoEl), width: `calc(${pos(l.venceEl)} - ${pos(l.creadoEl)})`, background: l.restantes > 0 ? COLOR_ORIGEN[l.origen] : "#b9b4ac" }}>
                  {l.restantes > 0 ? `${l.restantes} ${l.restantes === 1 ? "queda" : "quedan"}` : l.vencidos > 0 ? `${l.vencidos} ${l.vencidos === 1 ? "vencido" : "vencidos"}` : "usado"}
                </div>
                <div className="tl-today" style={{ left: pos(db.hoy) }}>
                  {l === enLinea[0] && <span>hoy</span>}
                </div>
              </div>
            </div>
          ))}
          {!enLinea.length && <p className="muted">Todavía no tiene créditos.</p>}
        </div>
      </div>

      <div className="cards-wide" style={{ alignItems: "start" }}>
        <div>
          <h3 className="h3" style={{ marginBottom: 10 }}>
            Lotes
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Vence</th>
                  <th className="num">Quedan</th>
                  <th className="num">Usados</th>
                  <th className="num">Vencidos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((l) => {
                  const [e, t] = estadoEtq[estadoLote(l, db)];
                  return (
                    <tr key={l.id}>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          {l.origen === "bienvenida" ? <Gift size={15} color="var(--sup)" /> : <ShoppingBag size={15} color="var(--accent)" />}
                          <b>{l.nombre}</b>
                        </div>
                        <div className="muted small">desde {fechaCorta(l.creadoEl)}</div>
                      </td>
                      <td>{fechaCorta(l.venceEl)}</td>
                      <td className="num">{l.restantes}</td>
                      <td className="num">{usados(l)}</td>
                      <td className="num">{l.vencidos}</td>
                      <td>
                        <span className={`badge ${t}`}>{e}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="h3" style={{ marginBottom: 10 }}>
            Movimientos
          </h3>
          <div className="table-wrap" style={{ maxHeight: 420, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Qué pasó</th>
                  <th className="num">Créditos</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{fechaCorta(m.fecha)}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{m.nota}</div>
                      <div className="muted small">{db.lotes.find((l) => l.id === m.loteId)?.nombre}</div>
                    </td>
                    <td className="num" style={{ fontWeight: 900, color: m.cantidad > 0 ? "var(--ok)" : m.tipo === "vencimiento" ? "var(--err)" : "var(--ink)" }}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <BuyCredits open={comprar} onClose={() => setComprar(false)} />
    </div>
  );
}

function Avisos() {
  const { db, yo, marcarLeidos } = useStore();
  if (!db || !yo) return null;
  const lista = db.avisos.filter((a) => a.usuarioId === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  return (
    <div className="card card-pad" style={{ maxWidth: 820 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <h3 className="h3">Avisos</h3>
        <span className="spacer" />
        <button className="btn btn-sm" onClick={marcarLeidos}>
          Marcar todo como leído
        </button>
      </div>
      <p className="muted small" style={{ marginBottom: 12 }}>
        Los mismos avisos le llegan por correo. El WhatsApp de su cuenta queda solo para los compradores.
      </p>
      <div className="stack" style={{ gap: 6 }}>
        {lista.map((a) => (
          <Link key={a.id} href={a.href ?? "/panel"} className={`notif ${a.leido ? "" : "unread"}`}>
            {a.tipo === "credito" ? <Coins size={18} color="var(--accent)" /> : a.tipo === "contacto" ? <MessageCircle size={18} color="var(--wa)" /> : <Clock3 size={18} color="var(--sup)" />}
            <span style={{ flex: 1 }}>
              {a.texto}
              <small>{fechaLarga(a.fecha)}</small>
            </span>
            <ArrowUpRight size={15} color="var(--muted)" />
          </Link>
        ))}
        {!lista.length && <Empty icon={<Bell size={26} />} title="Sin avisos" />}
      </div>
    </div>
  );
}

function Panel() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = sp.get("tab") ?? "anuncios";
  const { db, yo } = useStore();
  const resumen = useMemo(() => {
    if (!db || !yo) return null;
    const mios = db.anuncios.filter((a) => a.vendedorId === yo.id);
    const sig = lotesEnOrden(db, yo.id)[0];
    return {
      creditos: saldo(db, yo.id),
      sig,
      activos: mios.filter((a) => a.estado === "activo").length,
      contactos: mios.reduce((s, a) => s + a.contactos, 0),
      sinLeer: db.avisos.filter((a) => a.usuarioId === yo.id && !a.leido).length,
    };
  }, [db, yo]);

  if (!db || !yo || !resumen) {
    return <div className="page wrap" />;
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="row" style={{ flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
          <Avatar foto={yo.foto} alt={yo.nombre} size={56} />
          <div>
            <div className="eyebrow">Mi panel</div>
            <h1 className="h2">{yo.negocio}</h1>
            <div className="muted small">
              {yo.nombre} · en Patio de Obra desde {fechaLarga(yo.registradoEl)}
            </div>
          </div>
          <span className="spacer" />
          <Link href="/publicar" className="btn btn-primary">
            <PlusCircle size={17} /> Publicar anuncio
          </Link>
        </div>

        <div className="kpis" style={{ marginBottom: 24 }}>
          <div className="card kpi">
            <div className="l">
              <Coins size={15} /> Créditos
            </div>
            <div className="v">{resumen.creditos}</div>
            <div className="s">{resumen.sig ? `${resumen.sig.restantes} ${resumen.sig.restantes === 1 ? "vence" : "vencen"} el ${fechaCorta(resumen.sig.venceEl)}` : "Sin créditos vigentes"}</div>
          </div>
          <div className="card kpi">
            <div className="l">
              <LayoutList size={15} /> Anuncios activos
            </div>
            <div className="v">{resumen.activos}</div>
            <div className="s">visibles en las búsquedas</div>
          </div>
          <div className="card kpi">
            <div className="l">
              <MessageCircle size={15} /> Le escribieron
            </div>
            <div className="v">{resumen.contactos}</div>
            <div className="s">veces por WhatsApp desde sus anuncios</div>
          </div>
          <div className="card kpi">
            <div className="l">
              <Bell size={15} /> Avisos sin leer
            </div>
            <div className="v">{resumen.sinLeer}</div>
            <div className="s">vencimientos y contactos</div>
          </div>
        </div>

        <div className="tabs" role="tablist">
          {(
            [
              ["anuncios", "Mis anuncios", LayoutList],
              ["creditos", "Créditos", Coins],
              ["avisos", "Avisos", Bell],
            ] as const
          ).map(([k, l, I]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => router.replace(`/panel?tab=${k}`, { scroll: false })}>
              <I size={16} /> {l}
            </button>
          ))}
        </div>
        {tab === "anuncios" && <Anuncios />}
        {tab === "creditos" && <Creditos />}
        {tab === "avisos" && <Avisos />}
      </div>
    </div>
  );
}

export default function PanelPage() {
  return (
    <Suspense fallback={<div className="page wrap" />}>
      <Panel />
    </Suspense>
  );
}
