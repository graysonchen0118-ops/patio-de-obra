"use client";

import { useState } from "react";
import { Coins, CreditCard, Store, Landmark, CheckCircle2, Clock3 } from "lucide-react";
import type { MetodoPago, Pago } from "@/lib/types";
import { useStore } from "@/lib/store";
import { fechaCorta, pesos, sumarMeses } from "@/lib/format";
import { Modal, Spin } from "./ui";

export default function BuyCredits({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, comprar, confirmarPago } = useStore();
  const [pq, setPq] = useState("p10");
  const [metodo, setMetodo] = useState<MetodoPago>("tarjeta");
  const [tarjeta, setTarjeta] = useState({ nombre: "", numero: "", vence: "", cvv: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [pago, setPago] = useState<Pago | null>(null);
  if (!db) return null;
  const paquete = db.paquetes.find((p) => p.id === pq)!;
  const vence = sumarMeses(db.hoy, db.reglas.compraMeses);
  const pagoVivo = pago ? db.pagos.find((p) => p.id === pago.id) ?? pago : null;

  const cerrar = () => {
    setPago(null);
    setErr({});
    setBusy(false);
    onClose();
  };

  const pagar = async () => {
    if (metodo === "tarjeta") {
      const e: Record<string, string> = {};
      if (tarjeta.nombre.trim().length < 3) e.nombre = "Escriba el nombre como aparece en la tarjeta.";
      if (tarjeta.numero.replace(/\D/g, "").length !== 16) e.numero = "La tarjeta lleva 16 dígitos.";
      if (!/^\d{2}\/\d{2}$/.test(tarjeta.vence)) e.vence = "Formato MM/AA.";
      if (!/^\d{3,4}$/.test(tarjeta.cvv)) e.cvv = "3 o 4 dígitos.";
      setErr(e);
      if (Object.keys(e).length) return;
    }
    setBusy(true);
    const p = await comprar(pq, metodo);
    setBusy(false);
    setPago(p);
  };

  const confirmar = async () => {
    if (!pago) return;
    setBusy(true);
    await confirmarPago(pago.id);
    setBusy(false);
  };

  const listo = pagoVivo?.estado === "pagado";

  return (
    <Modal open={open} onClose={cerrar} title="Comprar créditos" icon={<Coins size={20} color="var(--accent)" />} width={620}>
      {!pago && (
        <div className="stack">
          <div className="packs">
            {db.paquetes.map((p) => (
              <button key={p.id} className={`pack ${pq === p.id ? "on" : ""}`} onClick={() => setPq(p.id)}>
                {p.destacado && <span className="badge acc tag">El más usado</span>}
                <div className="big">{p.creditos}</div>
                <div className="small muted" style={{ fontWeight: 700 }}>{p.creditos === 1 ? "crédito" : "créditos"}</div>
                <div style={{ fontWeight: 900, marginTop: 8 }}>{pesos(p.precio)}</div>
                <div className="small muted">{pesos(Math.round((p.precio / p.creditos) * 100) / 100)} por anuncio</div>
              </button>
            ))}
          </div>
          <div className="banner info">
            <Clock3 size={18} />
            <span>
              {paquete.creditos === 1 ? "Este crédito vence" : `Estos ${paquete.creditos} créditos vencen`} el <b>{fechaCorta(vence)}</b>, seis meses después de la compra. Cada lote lleva su propia fecha y siempre se usa primero el que vence antes.
            </span>
          </div>
          <div>
            <div className="field" style={{ marginBottom: 8 }}>
              <span>Forma de pago</span>
            </div>
            <div className="wrap-row">
              {(
                [
                  ["tarjeta", "Tarjeta", CreditCard],
                  ["oxxo", "Efectivo en OXXO", Store],
                  ["spei", "Transferencia SPEI", Landmark],
                ] as const
              ).map(([id, label, Icon]) => (
                <button key={id} className={`chip ${metodo === id ? "on" : ""}`} onClick={() => setMetodo(id)}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
          </div>
          {metodo === "tarjeta" && (
            <div className="form-grid">
              <label className="field">
                <span>Nombre en la tarjeta</span>
                <input className={`input ${err.nombre ? "bad" : ""}`} value={tarjeta.nombre} onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value })} />
                {err.nombre && <span className="err-text">{err.nombre}</span>}
              </label>
              <label className="field">
                <span>Número</span>
                <input className={`input ${err.numero ? "bad" : ""}`} inputMode="numeric" placeholder="0000 0000 0000 0000" value={tarjeta.numero} onChange={(e) => setTarjeta({ ...tarjeta, numero: e.target.value.replace(/[^\d ]/g, "").slice(0, 19) })} />
                {err.numero && <span className="err-text">{err.numero}</span>}
              </label>
              <label className="field">
                <span>Vence</span>
                <input className={`input ${err.vence ? "bad" : ""}`} placeholder="MM/AA" value={tarjeta.vence} onChange={(e) => setTarjeta({ ...tarjeta, vence: e.target.value.slice(0, 5) })} />
                {err.vence && <span className="err-text">{err.vence}</span>}
              </label>
              <label className="field">
                <span>CVV</span>
                <input className={`input ${err.cvv ? "bad" : ""}`} inputMode="numeric" value={tarjeta.cvv} onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                {err.cvv && <span className="err-text">{err.cvv}</span>}
              </label>
            </div>
          )}
          {metodo !== "tarjeta" && (
            <p className="muted small">
              {metodo === "oxxo" ? "Le damos una referencia para pagar en cualquier OXXO. Los créditos se suman cuando la tienda confirma el pago." : "Le damos una CLABE para transferir desde su banco. Los créditos se suman al confirmarse la transferencia."}
            </p>
          )}
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={pagar} disabled={busy}>
              {busy ? <Spin /> : <Coins size={17} />} {metodo === "tarjeta" ? `Pagar ${pesos(paquete.precio)}` : "Generar referencia"}
            </button>
          </div>
        </div>
      )}

      {pago && !listo && (
        <div className="stack">
          <div className="banner warn">
            <Clock3 size={18} />
            <span>
              Pago pendiente por <b>{pesos(pago.monto)}</b>. {pago.creditos === 1 ? "El crédito aparece" : `Los ${pago.creditos} créditos aparecen`} en cuanto se confirme.
            </span>
          </div>
          <div className="card card-pad" style={{ textAlign: "center" }}>
            <div className="muted small" style={{ fontWeight: 800 }}>{pago.metodo === "oxxo" ? "Referencia para pagar en OXXO" : "CLABE para transferir"}</div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", marginTop: 6 }}>{pago.referencia}</div>
            <div className="muted small" style={{ marginTop: 6 }}>Válida por 3 días</div>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn" onClick={cerrar}>
              Pagar después
            </button>
            <button className="btn btn-dark" onClick={confirmar} disabled={busy}>
              {busy ? <Spin /> : <CheckCircle2 size={17} />} Ya pagué, revisar
            </button>
          </div>
        </div>
      )}

      {pago && listo && (
        <div className="stack" style={{ textAlign: "center", alignItems: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--ok-soft)", color: "var(--ok)", display: "grid", placeItems: "center" }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 className="h3">Listo, sumó {pago.creditos} {pago.creditos === 1 ? "crédito" : "créditos"}</h3>
          <p className="muted">Vencen el {fechaCorta(vence)}. Los que ya tenía conservan su propia fecha.</p>
          <button className="btn btn-primary" onClick={cerrar}>
            Seguir
          </button>
        </div>
      )}
    </Modal>
  );
}
