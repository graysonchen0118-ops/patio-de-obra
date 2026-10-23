"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Copy } from "lucide-react";
import type { Anuncio, Ubicacion, Usuario } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cantidadUnidad, enmascararTel, pesos } from "@/lib/format";
import { etiquetaLugar } from "@/lib/geo";
import { Modal } from "./ui";

export default function WhatsAppModal({ open, onClose, a, vendedor, desde }: { open: boolean; onClose: () => void; a: Anuncio; vendedor: Usuario; desde: Ubicacion }) {
  const { registrarContacto, toast } = useStore();
  const base = `Hola, vi en Patio de Obra su anuncio "${a.titulo}" (${pesos(a.precio)} por ${a.unidad}). Sigue disponible? Me interesan ${cantidadUnidad(a.minimo ?? 1, a.unidad)} y estoy en ${etiquetaLugar(desde)}.`;
  const [texto, setTexto] = useState(base);
  useEffect(() => {
    if (open) setTexto(base);
  }, [open, base]);

  const abrir = () => {
    registrarContacto(a.id);
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    onClose();
    toast(`Se abrió WhatsApp con el mensaje para ${vendedor.nombre}.`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Escribirle a ${vendedor.nombre}`}
      icon={<MessageCircle size={20} color="var(--wa)" />}
      foot={
        <>
          <button
            className="btn"
            onClick={() => {
              navigator.clipboard?.writeText(texto).catch(() => {});
              toast("Mensaje copiado.", "info");
            }}
          >
            <Copy size={16} /> Copiar
          </button>
          <button className="btn btn-wa" onClick={abrir}>
            <MessageCircle size={17} /> Abrir WhatsApp
          </button>
        </>
      }
    >
      <p className="muted small" style={{ marginBottom: 12 }}>
        El mensaje ya lleva el nombre del anuncio, el precio y desde dónde escribe, para que el vendedor sepa de qué lote le hablan aunque tenga varios publicados. Puede cambiarlo antes de enviarlo.
      </p>
      <div className="wa-chat">
        <div className="wa-bubble">
          {texto}
          <small>ahora</small>
        </div>
      </div>
      <label className="field" style={{ marginTop: 14 }}>
        <span>Su mensaje</span>
        <textarea className="input" value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} />
      </label>
      <div className="row small" style={{ marginTop: 12, color: "var(--ok)", fontWeight: 700 }}>
        <ShieldCheck size={16} /> WhatsApp confirmado del vendedor: {enmascararTel(vendedor.telefono)}
      </div>
    </Modal>
  );
}
