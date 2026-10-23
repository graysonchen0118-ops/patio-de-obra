"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { CheckCircle2, Info, AlertTriangle, X, UserRound } from "lucide-react";
import { useStore } from "@/lib/store";
import { avatar } from "@/lib/photos";

export function Toasts() {
  const { toasts, cerrarToast } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === "ok" ? <CheckCircle2 size={19} /> : t.kind === "error" ? <AlertTriangle size={19} /> : <Info size={19} />}
          <span style={{ flex: 1 }}>{t.text}</span>
          <button onClick={() => cerrarToast(t.id)} aria-label="Cerrar" style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", opacity: 0.7 }}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, icon, children, foot, width }: { open: boolean; onClose: () => void; title: string; icon?: ReactNode; children: ReactNode; foot?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={width ? { maxWidth: width } : undefined}>
        <div className="modal-head">
          {icon}
          <h3 className="h3" style={{ flex: 1 }}>
            {title}
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
}

export const Spin = () => <span className="spin" aria-hidden="true" />;

export function Skel({ h = 16, w = "100%", r = 10, style }: { h?: number; w?: number | string; r?: number; style?: CSSProperties }) {
  return <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function CardSkel() {
  return (
    <div className="lc" style={{ animation: "none" }}>
      <div className="skel" style={{ aspectRatio: "4 / 3", borderRadius: 0 }} />
      <div className="lc-body">
        <Skel h={16} w="85%" />
        <Skel h={14} w="55%" />
        <Skel h={22} w="40%" />
      </div>
    </div>
  );
}

export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ico">{icon}</div>
      <h3 className="h3">{title}</h3>
      {children && <p style={{ maxWidth: 440, margin: "0 auto" }}>{children}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function Avatar({ foto, size = 52, alt }: { foto: string; size?: number; alt: string }) {
  if (!foto)
    return (
      <span className="avatar-icon" style={{ width: size, height: size }} aria-label={alt}>
        <UserRound size={size * 0.5} />
      </span>
    );
  return <img className="avatar" src={avatar(foto)} alt={alt} width={size} height={size} style={{ width: size, height: size }} loading="lazy" />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="sw" />
      <span>{label}</span>
    </label>
  );
}

// Inclinación en perspectiva real bajo el puntero, con el brillo siguiendo la luz.
export function useTilt<T extends HTMLElement>(fuerza = 7) {
  const [el, setEl] = useState<T | null>(null);
  useEffect(() => {
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * fuerza}deg) rotateY(${(x - 0.5) * fuerza}deg) translateY(-4px)`;
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [el, fuerza]);
  return setEl;
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) {
          setIn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function useCargando(dep: unknown, ms = 450) {
  const [cargando, setC] = useState(true);
  useEffect(() => {
    setC(true);
    const t = setTimeout(() => setC(false), ms);
    return () => clearTimeout(t);
  }, [dep, ms]);
  return cargando;
}
