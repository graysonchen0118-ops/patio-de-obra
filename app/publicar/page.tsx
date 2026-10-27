"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrickWall, PaintRoller, Wrench, Layers, Hammer, Truck, Check, ImagePlus, Coins, MapPin, Clock3, Send, Save, AlertTriangle, ShieldCheck } from "lucide-react";
import type { Condicion } from "@/lib/types";
import { useStore } from "@/lib/store";
import { lotesEnOrden, saldo } from "@/lib/engine";
import { buscarCP, etiquetaLugar, ubicacion } from "@/lib/geo";
import { foto } from "@/lib/photos";
import { cantidadUnidad, fechaCorta, pesos, sumarDias, plural } from "@/lib/format";
import { Spin, Toggle, Empty } from "@/components/ui";
import BuyCredits from "@/components/BuyCredits";
import { Pila } from "@/components/three/Scenes";
import { tipoPila } from "@/components/three/StackScene";

const ICONOS: Record<string, typeof BrickWall> = { BrickWall, PaintRoller, Wrench, Layers, Hammer, Truck };

interface Form {
  catId: string;
  subId: string;
  titulo: string;
  campos: Record<string, string>;
  condicion: Condicion;
  descripcion: string;
  unidad: string;
  cantidad: string;
  precio: string;
  minimo: string;
  factura: boolean;
  flete: boolean;
  cp: string;
  fotos: string[];
}

function Publicador() {
  const sp = useSearchParams();
  const editar = sp.get("editar");
  const router = useRouter();
  const { db, yo, publicar, editarAnuncio, toast } = useStore();
  const [f, setF] = useState<Form | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [comprar, setComprar] = useState(false);

  useEffect(() => {
    if (!db || !yo || f) return;
    const a = editar ? db.anuncios.find((x) => x.id === editar && x.vendedorId === yo.id) : null;
    if (a) {
      setF({
        catId: a.catId,
        subId: a.subId,
        titulo: a.titulo,
        campos: { ...a.campos },
        condicion: a.condicion,
        descripcion: a.descripcion,
        unidad: a.unidad,
        cantidad: String(a.cantidad),
        precio: String(a.precio),
        minimo: a.minimo ? String(a.minimo) : "",
        factura: a.factura,
        flete: a.flete,
        cp: ubicacion(a.ubicacionId).cp,
        fotos: [...a.fotos],
      });
    } else {
      setF({ catId: "", subId: "", titulo: "", campos: {}, condicion: "Nuevo", descripcion: "", unidad: "", cantidad: "", precio: "", minimo: "", factura: false, flete: false, cp: ubicacion(yo.ubicacionId).cp, fotos: [] });
    }
  }, [db, yo, editar, f]);

  const cat = db?.categorias.find((c) => c.id === f?.catId);
  const sub = cat?.sub.find((s) => s.id === f?.subId);
  const lugar = f ? buscarCP(f.cp) : null;
  const disponibles = db && yo ? saldo(db, yo.id) : 0;
  const siguiente = db && yo ? lotesEnOrden(db, yo.id)[0] : undefined;
  const editando = !!(editar && db?.anuncios.find((x) => x.id === editar));
  const vence = db ? sumarDias(db.hoy, db.reglas.anuncioDias) : "";
  const subidas = useMemo(() => (f ? f.fotos.filter((x) => x.startsWith("blob:")) : []), [f]);

  if (!db || !yo || !f) {
    return <div className="page wrap" />;
  }
  if (editar && !editando) {
    return (
      <div className="page wrap">
        <Empty icon={<AlertTriangle size={28} />} title="No encontramos ese anuncio en su cuenta" action={<Link href="/panel" className="btn btn-primary">Ir a mi panel</Link>} />
      </div>
    );
  }

  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const elegirSub = (subId: string) => {
    const s = cat?.sub.find((x) => x.id === subId);
    set({ subId, unidad: s?.unidades[0] ?? "pieza", campos: {}, fotos: f.fotos.filter((x) => x.startsWith("blob:")) });
  };

  const validar = () => {
    const e: Record<string, string> = {};
    if (!f.subId) e.sub = "Elija qué está vendiendo.";
    if (f.titulo.trim().length < 8) e.titulo = "Un título de al menos 8 letras ayuda a que lo encuentren.";
    sub?.campos.forEach((c) => {
      if (c.requerido && !f.campos[c.id]?.trim()) e[`c_${c.id}`] = "Este dato es obligatorio en esta categoría.";
    });
    if (!(Number(f.precio) > 0)) e.precio = "Ponga el precio por unidad.";
    if (!(Number(f.cantidad) >= 1)) e.cantidad = "Cuántos le quedan, al menos 1.";
    if (f.minimo && Number(f.minimo) > Number(f.cantidad)) e.minimo = "El mínimo no puede ser mayor que lo disponible.";
    if (!lugar) e.cp = "Código postal no encontrado.";
    if (!f.fotos.length) e.fotos = "Elija o suba al menos una foto.";
    setErr(e);
    if (Object.keys(e).length) {
      toast("Revise los campos marcados.", "error");
      const primero = document.querySelector(".bad, .err-text");
      primero?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return !Object.keys(e).length;
  };

  const enviar = async () => {
    if (!validar() || !lugar) return;
    const datos = {
      titulo: f.titulo.trim(),
      catId: f.catId,
      subId: f.subId,
      campos: f.campos,
      condicion: f.condicion,
      precio: Number(f.precio),
      unidad: f.unidad,
      cantidad: Math.round(Number(f.cantidad)),
      minimo: f.minimo ? Math.round(Number(f.minimo)) : undefined,
      ubicacionId: lugar.id,
      fotos: f.fotos,
      descripcion: f.descripcion.trim() || "Sin descripción adicional.",
      factura: f.factura,
      flete: f.flete,
    };
    setBusy(true);
    if (editando && editar) {
      await editarAnuncio(editar, datos);
      setBusy(false);
      router.push(`/anuncio/${editar}`);
      return;
    }
    const r = await publicar(datos);
    setBusy(false);
    if (!r.ok) {
      setComprar(true);
      toast("No le quedan créditos. Compre un paquete y su anuncio se publica igual.", "error");
      return;
    }
    toast(`Publicado. Queda visible hasta el ${fechaCorta(vence)}.`);
    if (r.alertas > 0) toast(`${r.alertas === 1 ? "Un comprador tenía" : `${r.alertas} compradores tenían`} una alerta para este material cerca: ya les avisamos por correo.`, "info");
    router.push(`/anuncio/${r.id}`);
  };

  const subirFotos = (files: FileList | null) => {
    if (!files) return;
    const nuevas = Array.from(files)
      .slice(0, 6 - f.fotos.length)
      .map((file) => URL.createObjectURL(file));
    set({ fotos: [...f.fotos, ...nuevas] });
  };

  return (
    <div className="page">
      <div className="wrap">
        <div className="eyebrow">{editando ? "Editar anuncio" : "Nuevo anuncio"}</div>
        <h1 className="h2" style={{ marginTop: 6 }}>
          {editando ? "Corrija lo que haga falta" : "Publique su material sobrante"}
        </h1>
        <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>
          {editando ? "Editar no gasta créditos y no cambia la fecha de vigencia." : `Un anuncio usa 1 crédito y queda visible ${db.reglas.anuncioDias} días.`}
        </p>

        <div className="publish-layout">
          <div className="stack" style={{ gap: 18 }}>
            <section className="card step">
              <div className="step-head">
                <span className="step-num">1</span>
                <h2 className="h3">Qué vende</h2>
              </div>
              <div className="pick-grid">
                {db.categorias.map((c) => {
                  const Icon = ICONOS[c.icono] ?? BrickWall;
                  return (
                    <button key={c.id} className={`pick ${f.catId === c.id ? "on" : ""}`} onClick={() => set({ catId: c.id, subId: "", campos: {} })} disabled={editando}>
                      <Icon size={22} color="var(--accent)" />
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
              {cat && (
                <div className="wrap-row" style={{ marginTop: 14 }}>
                  {cat.sub.map((s) => (
                    <button key={s.id} className={`chip ${f.subId === s.id ? "on" : ""}`} onClick={() => elegirSub(s.id)} disabled={editando}>
                      {s.nombre}
                    </button>
                  ))}
                </div>
              )}
              {err.sub && <p className="err-text" style={{ marginTop: 8 }}>{err.sub}</p>}
            </section>

            {sub && (
              <section className="card step">
                <div className="step-head">
                  <span className="step-num">2</span>
                  <h2 className="h3">Cómo es</h2>
                </div>
                <div className="stack">
                  <label className="field">
                    <span>Título</span>
                    <input className={`input ${err.titulo ? "bad" : ""}`} value={f.titulo} onChange={(e) => set({ titulo: e.target.value })} placeholder={`Ej. ${sub.nombre.split(" ")[0]} sobrante de obra, en buen estado`} maxLength={80} />
                    {err.titulo && <span className="err-text">{err.titulo}</span>}
                  </label>
                  <div className="form-grid">
                    {sub.campos.map((c) => (
                      <label key={c.id} className="field">
                        <span>
                          {c.etiqueta}
                          {c.requerido ? "" : " (opcional)"}
                        </span>
                        {c.tipo === "lista" ? (
                          <select className={`input ${err[`c_${c.id}`] ? "bad" : ""}`} value={f.campos[c.id] ?? ""} onChange={(e) => set({ campos: { ...f.campos, [c.id]: e.target.value } })}>
                            <option value="">Elija</option>
                            {c.opciones?.map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input className={`input ${err[`c_${c.id}`] ? "bad" : ""}`} inputMode={c.tipo === "numero" ? "numeric" : undefined} value={f.campos[c.id] ?? ""} onChange={(e) => set({ campos: { ...f.campos, [c.id]: c.tipo === "numero" ? e.target.value.replace(/\D/g, "") : e.target.value } })} />
                        )}
                        {err[`c_${c.id}`] && <span className="err-text">{err[`c_${c.id}`]}</span>}
                      </label>
                    ))}
                  </div>
                  <div className="field">
                    <span>Condición</span>
                    <div className="wrap-row">
                      {(["Nuevo", "Seminuevo", "Usado"] as Condicion[]).map((c) => (
                        <button key={c} className={`chip ${f.condicion === c ? "on" : ""}`} onClick={() => set({ condicion: c })}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="field">
                    <span>Descripción (opcional)</span>
                    <textarea className="input" value={f.descripcion} onChange={(e) => set({ descripcion: e.target.value })} placeholder="De qué obra salió, cómo está guardado, si se puede revisar antes..." />
                  </label>
                </div>
              </section>
            )}

            {sub && (
              <section className="card step">
                <div className="step-head">
                  <span className="step-num">3</span>
                  <h2 className="h3">Cuánto hay y a qué precio</h2>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Se vende por</span>
                    <select className="input" value={f.unidad} onChange={(e) => set({ unidad: e.target.value })}>
                      {sub.unidades.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Cantidad disponible</span>
                    <input className={`input ${err.cantidad ? "bad" : ""}`} inputMode="numeric" value={f.cantidad} onChange={(e) => set({ cantidad: e.target.value.replace(/\D/g, "") })} placeholder="120" />
                    {err.cantidad && <span className="err-text">{err.cantidad}</span>}
                  </label>
                  <label className="field">
                    <span>Precio por {f.unidad || "unidad"} (MXN)</span>
                    <input className={`input ${err.precio ? "bad" : ""}`} inputMode="decimal" value={f.precio} onChange={(e) => set({ precio: e.target.value.replace(/[^\d.]/g, "") })} placeholder="195" />
                    {err.precio && <span className="err-text">{err.precio}</span>}
                  </label>
                  <label className="field">
                    <span>Venta mínima (opcional)</span>
                    <input className={`input ${err.minimo ? "bad" : ""}`} inputMode="numeric" value={f.minimo} onChange={(e) => set({ minimo: e.target.value.replace(/\D/g, "") })} placeholder="10" />
                    {err.minimo && <span className="err-text">{err.minimo}</span>}
                  </label>
                </div>
                <div className="wrap-row" style={{ marginTop: 16, gap: 20 }}>
                  <Toggle checked={f.factura} onChange={(v) => set({ factura: v })} label="Emito factura" />
                  <Toggle checked={f.flete} onChange={(v) => set({ flete: v })} label="Puedo llevarlo con costo" />
                </div>
              </section>
            )}

            {sub && (
              <section className="card step">
                <div className="step-head">
                  <span className="step-num">4</span>
                  <h2 className="h3">Dónde está el material</h2>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Código postal</span>
                    <input className={`input ${err.cp ? "bad" : ""}`} inputMode="numeric" value={f.cp} onChange={(e) => set({ cp: e.target.value.replace(/\D/g, "").slice(0, 5) })} />
                    {err.cp && <span className="err-text">{err.cp}</span>}
                  </label>
                  <div className="field">
                    <span>Así lo verán los compradores</span>
                    <div className="row" style={{ minHeight: 46, fontWeight: 800 }}>
                      <MapPin size={17} color="var(--accent)" /> {lugar ? etiquetaLugar(lugar) : "Escriba los cinco dígitos"}
                    </div>
                  </div>
                </div>
                <p className="muted small" style={{ marginTop: 10 }}>
                  <ShieldCheck size={14} style={{ verticalAlign: -2 }} /> Nunca mostramos su dirección. Con el código postal calculamos la distancia a cada comprador; la ubicación exacta la comparte usted por WhatsApp cuando ya hay trato.
                </p>
              </section>
            )}

            {sub && (
              <section className="card step">
                <div className="step-head">
                  <span className="step-num">5</span>
                  <h2 className="h3">Fotos</h2>
                  <span className="muted small" style={{ marginLeft: "auto" }}>
                    {f.fotos.length} de 6
                  </span>
                </div>
                <div className="photo-pick">
                  {sub.fotos.map((k) => {
                    const on = f.fotos.includes(k);
                    return (
                      <button key={k} className={on ? "on" : ""} onClick={() => set({ fotos: on ? f.fotos.filter((x) => x !== k) : f.fotos.length < 6 ? [...f.fotos, k] : f.fotos })} aria-label="Elegir foto">
                        <img src={foto(k, 240, 240)} alt="" width={110} height={110} />
                        {on && (
                          <span className="ck">
                            <Check size={14} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {subidas.map((k) => (
                    <button key={k} className="on" onClick={() => set({ fotos: f.fotos.filter((x) => x !== k) })} aria-label="Quitar foto">
                      <img src={k} alt="" width={110} height={110} />
                      <span className="ck">
                        <Check size={14} />
                      </span>
                    </button>
                  ))}
                  <label>
                    <input type="file" accept="image/*" multiple hidden onChange={(e) => subirFotos(e.target.files)} />
                    <span>
                      <ImagePlus size={22} />
                      <br />
                      Subir desde su celular
                    </span>
                  </label>
                </div>
                {err.fotos && <p className="err-text" style={{ marginTop: 8 }}>{err.fotos}</p>}
              </section>
            )}
          </div>

          <aside className="sticky-side stack">
            <div className="card card-pad">
              <h3 className="h3">Así se verá</h3>
              <div className="stack-box" style={{ marginTop: 12, height: 200 }}>
                {sub ? <Pila tipo={tipoPila(sub.id)} cantidad={Number(f.cantidad) || 0} maximo={Math.max(Number(f.cantidad) || 1, 1)} /> : <div className="empty" style={{ padding: 30 }}>Elija una categoría</div>}
                {sub && Number(f.cantidad) > 0 && <div className="stack-label">{cantidadUnidad(Number(f.cantidad), f.unidad)}</div>}
              </div>
              <div style={{ marginTop: 12 }}>
                <b style={{ display: "block", lineHeight: 1.3 }}>{f.titulo || "Título de su anuncio"}</b>
                <div className="lc-price" style={{ marginTop: 4 }}>
                  {f.precio ? pesos(Number(f.precio)) : "$0"} <span>/ {f.unidad || "unidad"}</span>
                </div>
                <div className="muted small">{lugar ? etiquetaLugar(lugar) : ""}</div>
              </div>
            </div>

            <div className="card card-pad">
              {editando ? (
                <div className="banner info">
                  <Clock3 size={18} />
                  <span>Guardar los cambios no gasta créditos. La vigencia sigue igual.</span>
                </div>
              ) : disponibles > 0 && siguiente ? (
                <div className="stack" style={{ gap: 10 }}>
                  <div className="row">
                    <Coins size={18} color="var(--accent)" />
                    <b>Usa 1 crédito</b>
                    <span className="spacer" />
                    <span className="badge">
                      Le quedan {disponibles - 1} después
                    </span>
                  </div>
                  <div className="small" style={{ color: "var(--ink-2)" }}>
                    Visible {db.reglas.anuncioDias} días, hasta el <b>{fechaCorta(vence)}</b>.
                  </div>
                  <div className="banner acc small" style={{ padding: "10px 12px" }}>
                    <Clock3 size={16} />
                    <span>
                      Se descuenta de <b>{siguiente.nombre.toLowerCase()}</b>, que vence el {fechaCorta(siguiente.venceEl)}: siempre se gasta primero el lote que vence antes.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  <div className="banner warn">
                    <AlertTriangle size={18} />
                    <span>No le quedan créditos. Compre un paquete para publicar; desde {pesos(db.paquetes[0].precio)} por {plural("anuncio", 1)}.</span>
                  </div>
                  <button className="btn" onClick={() => setComprar(true)}>
                    <Coins size={16} /> Comprar créditos
                  </button>
                </div>
              )}
              <button className="btn btn-primary btn-block" style={{ marginTop: 14, minHeight: 50 }} onClick={enviar} disabled={busy}>
                {busy ? <Spin /> : editando ? <Save size={18} /> : <Send size={18} />} {editando ? "Guardar cambios" : "Publicar anuncio"}
              </button>
            </div>
          </aside>
        </div>
      </div>
      <BuyCredits open={comprar} onClose={() => setComprar(false)} />
    </div>
  );
}

export default function PublicarPage() {
  return (
    <Suspense fallback={<div className="page wrap" />}>
      <Publicador />
    </Suspense>
  );
}
