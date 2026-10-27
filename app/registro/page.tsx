"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Gift, MessageCircle, PlusCircle, ShieldAlert, Smartphone, UserPlus, MapPin } from "lucide-react";
import type { TipoVendedor } from "@/lib/types";
import { useStore } from "@/lib/store";
import { buscarCP, etiquetaLugar } from "@/lib/geo";
import { fechaCorta, fechaLarga, sumarDias } from "@/lib/format";
import { Spin } from "@/components/ui";

const TIPOS: TipoVendedor[] = ["Constructora", "Ferretería", "Maestro de obra", "Renta de maquinaria", "Particular"];

export default function Registro() {
  const { db, registrar } = useStore();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [d, setD] = useState({ nombre: "", negocio: "", tipo: "Maestro de obra" as TipoVendedor, telefono: "", email: "", cp: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState("");
  const [nota, setNota] = useState(false);
  const [busy, setBusy] = useState(false);
  const [espera, setEspera] = useState(0);
  const [res, setRes] = useState<{ bloqueado: boolean; desde?: string } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const lugar = buscarCP(d.cp);

  const mandarCodigo = () => {
    const c = String(100000 + Math.floor(Math.random() * 899999));
    setEnviado(c);
    setNota(false);
    setTimeout(() => setNota(true), 900);
    setEspera(30);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setEspera((s) => (s <= 1 ? (clearInterval(timer.current!), 0) : s - 1)), 1000);
  };

  const seguir = (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (d.nombre.trim().length < 3) x.nombre = "Escriba su nombre.";
    if (!/^\d{10}$/.test(d.telefono)) x.telefono = "Son 10 dígitos, sin el 52.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) x.email = "Revise el correo.";
    if (!lugar) x.cp = "Código postal no encontrado.";
    setErr(x);
    if (Object.keys(x).length) return;
    setPaso(2);
    mandarCodigo();
  };

  const verificar = async () => {
    if (codigo !== enviado) {
      setErr({ codigo: "El código no coincide. Revise el último mensaje." });
      return;
    }
    setErr({});
    setBusy(true);
    setNota(false);
    const r = await registrar({ nombre: d.nombre.trim(), negocio: d.negocio.trim() || d.nombre.trim(), tipo: d.tipo, telefono: d.telefono, email: d.email.trim(), ubicacionId: lugar!.id });
    setBusy(false);
    setRes(r);
    setPaso(3);
  };

  if (!db) return <div className="page wrap" />;
  const venceRegalo = sumarDias(db.hoy, db.reglas.bienvenidaDias);

  return (
    <div className="page">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="eyebrow">Crear cuenta de vendedor</div>
        <h1 className="h2" style={{ marginTop: 6 }}>
          {paso === 3 ? "Su cuenta está lista" : "Publique su primer lote con nuestro crédito"}
        </h1>
        <p className="muted" style={{ marginTop: 6, marginBottom: 22 }}>
          Registrarse y buscar es gratis. Al confirmar su WhatsApp recibe {db.reglas.bienvenidaCreditos} crédito de bienvenida válido por {db.reglas.bienvenidaDias} días, uno por número.
        </p>

        <div className="wrap-row" style={{ marginBottom: 18 }}>
          {["Sus datos", "Confirmar WhatsApp", "Listo"].map((t, n) => (
            <span key={t} className={`badge ${paso === n + 1 ? "acc" : paso > n + 1 ? "ok" : ""}`} style={{ padding: "6px 12px" }}>
              {n + 1}. {t}
            </span>
          ))}
        </div>

        {paso === 1 && (
          <form className="card step stack" onSubmit={seguir}>
            <div className="form-grid">
              <label className="field">
                <span>Su nombre</span>
                <input className={`input ${err.nombre ? "bad" : ""}`} value={d.nombre} onChange={(e) => setD({ ...d, nombre: e.target.value })} autoComplete="name" />
                {err.nombre && <span className="err-text">{err.nombre}</span>}
              </label>
              <label className="field">
                <span>Negocio (opcional)</span>
                <input className="input" value={d.negocio} onChange={(e) => setD({ ...d, negocio: e.target.value })} placeholder="Ferretería, constructora..." />
              </label>
            </div>
            <div className="field">
              <span>Usted es</span>
              <div className="wrap-row">
                {TIPOS.map((t) => (
                  <button type="button" key={t} className={`chip ${d.tipo === t ? "on" : ""}`} onClick={() => setD({ ...d, tipo: t })}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>WhatsApp</span>
                <input className={`input ${err.telefono ? "bad" : ""}`} inputMode="numeric" value={d.telefono} onChange={(e) => setD({ ...d, telefono: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="55 1234 5678" autoComplete="tel-national" />
                {err.telefono ? <span className="err-text">{err.telefono}</span> : <small>Es el número que verán los compradores.</small>}
              </label>
              <label className="field">
                <span>Correo</span>
                <input className={`input ${err.email ? "bad" : ""}`} value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} autoComplete="email" />
                {err.email ? <span className="err-text">{err.email}</span> : <small>Ahí le avisamos de vencimientos.</small>}
              </label>
              <label className="field">
                <span>Código postal</span>
                <input className={`input ${err.cp ? "bad" : ""}`} inputMode="numeric" value={d.cp} onChange={(e) => setD({ ...d, cp: e.target.value.replace(/\D/g, "").slice(0, 5) })} />
                {err.cp ? (
                  <span className="err-text">{err.cp}</span>
                ) : (
                  <small>
                    {lugar ? (
                      <>
                        <MapPin size={12} style={{ verticalAlign: -1 }} /> {etiquetaLugar(lugar)}
                      </>
                    ) : (
                      "Donde suele tener el material."
                    )}
                  </small>
                )}
              </label>
            </div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit">
                <MessageCircle size={17} /> Mandar código por WhatsApp
              </button>
            </div>
          </form>
        )}

        {paso === 2 && (
          <div className="card step stack">
            <div className="row">
              <Smartphone size={22} color="var(--sup)" />
              <div>
                <b>Le mandamos un código al {d.telefono.replace(/(\d{2})(\d{4})(\d{4})/, "$1 $2 $3")}</b>
                <div className="muted small">Escríbalo aquí para confirmar que el número es suyo.</div>
              </div>
            </div>
            <label className="field" style={{ maxWidth: 260 }}>
              <span>Código de 6 dígitos</span>
              <input className={`input ${err.codigo ? "bad" : ""}`} inputMode="numeric" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ fontSize: 22, letterSpacing: "0.3em", fontWeight: 900 }} autoFocus />
              {err.codigo && <span className="err-text">{err.codigo}</span>}
            </label>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setPaso(1)}>
                Cambiar número
              </button>
              <button className="btn btn-ghost" onClick={mandarCodigo} disabled={espera > 0}>
                {espera > 0 ? `Reenviar en ${espera} s` : "Reenviar código"}
              </button>
              <span className="spacer" />
              <button className="btn btn-primary" onClick={verificar} disabled={codigo.length !== 6 || busy}>
                {busy ? <Spin /> : <BadgeCheck size={17} />} Confirmar
              </button>
            </div>
          </div>
        )}

        {paso === 3 && res && (
          <div className="card step stack" style={{ alignItems: "flex-start" }}>
            {!res.bloqueado ? (
              <>
                <div className="banner ok" style={{ width: "100%" }}>
                  <Gift size={20} />
                  <span>
                    Tiene <b>{db.reglas.bienvenidaCreditos} crédito de bienvenida</b>. Úselo antes del <b>{fechaLarga(venceRegalo)}</b>; si no se usa, vence solo y no afecta los créditos que compre después.
                  </span>
                </div>
                <p className="muted">Con ese crédito publica un anuncio que dura {db.reglas.anuncioDias} días. Cuando le escriban y quiera publicar más, compra un paquete desde su panel.</p>
              </>
            ) : (
              <>
                <div className="banner warn" style={{ width: "100%" }}>
                  <ShieldAlert size={20} />
                  <span>
                    Su cuenta quedó creada, pero <b>este WhatsApp ya recibió el crédito de bienvenida</b>
                    {res.desde ? ` en otra cuenta el ${fechaCorta(res.desde)}` : ""}. El regalo se da una sola vez por número, aunque cambie el correo.
                  </span>
                </div>
                <p className="muted">Puede publicar comprando un paquete desde su panel. Si cree que es un error, escríbanos desde ese mismo WhatsApp.</p>
              </>
            )}
            <div className="row" style={{ flexWrap: "wrap" }}>
              <Link href="/publicar" className="btn btn-primary">
                <PlusCircle size={17} /> Publicar mi primer anuncio
              </Link>
              <Link href="/panel?tab=creditos" className="btn">
                Ver mis créditos
              </Link>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setPaso(1);
                  setCodigo("");
                  setRes(null);
                }}
              >
                <UserPlus size={16} /> Crear otra cuenta
              </button>
            </div>
          </div>
        )}
      </div>

      {nota && paso === 2 && (
        <button
          className="phone-note"
          onClick={() => {
            setCodigo(enviado);
            setNota(false);
          }}
        >
          <span className="ico">
            <MessageCircle size={20} />
          </span>
          <span>
            <b style={{ display: "block", fontSize: 13 }}>WhatsApp · {db.marca.nombre}</b>
            <span style={{ fontSize: 14 }}>
              Su código es <b style={{ letterSpacing: "0.08em" }}>{enviado}</b>. No lo comparta con nadie.
            </span>
            <span style={{ display: "block", fontSize: 11.5, opacity: 0.7, marginTop: 2 }}>Toque para copiarlo</span>
          </span>
        </button>
      )}
    </div>
  );
}
