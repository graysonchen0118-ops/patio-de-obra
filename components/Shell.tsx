"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, Boxes, CalendarClock, Coins, LayoutDashboard, Menu, PlusCircle, Search, Settings2, UserPlus, X, MessageCircle, Clock3, BadgeCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { saldo, lotesEnOrden } from "@/lib/engine";
import { diasEntre, fechaCorta, fechaDia } from "@/lib/format";
import { Backdrop } from "./three/Scenes";
import { Avatar, Toasts } from "./ui";
import { paleta } from "@/lib/color";
import type { Marca } from "@/lib/types";

function Marca_({ marca, small = true }: { marca: Marca; small?: boolean }) {
  return (
    <span className="brand-mark" style={marca.logo ? { background: "#fff", padding: 3 } : undefined}>
      {marca.logo ? <img src={marca.logo} alt="" width={30} height={30} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }} /> : <Boxes size={small ? 20 : 22} />}
    </span>
  );
}

const NAV = [
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/publicar", label: "Publicar anuncio", icon: PlusCircle },
  { href: "/panel", label: "Mi panel", icon: LayoutDashboard },
  { href: "/admin", label: "Administración", icon: Settings2 },
];

function useFuera(abierto: boolean, cerrar: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!abierto) return;
    const f = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cerrar();
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [abierto, cerrar]);
  return ref;
}

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { db, yo, marcarLeidos } = useStore();
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const bellRef = useFuera(bell, () => setBell(false));
  const menuRef = useFuera(menu, () => setMenu(false));

  useEffect(() => {
    setDrawer(false);
    setBell(false);
    setMenu(false);
  }, [path]);

  const marca = db?.marca ?? { nombre: "Patio de Obra", lema: "Sobrantes de construcción en todo México", color: "#b5452b", logo: null };
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(paleta(marca.color)).forEach(([k, v]) => root.style.setProperty(k, v));
    document.title = `${marca.nombre} | ${marca.lema}`;
    window.dispatchEvent(new CustomEvent("patio:pulso", { detail: "marca" }));
  }, [marca.color, marca.nombre, marca.lema]);

  const creditos = db && yo ? saldo(db, yo.id) : 0;
  const proximo = db && yo ? lotesEnOrden(db, yo.id)[0] : undefined;
  const porVencer = !!(db && proximo && diasEntre(db.hoy, proximo.venceEl) <= db.reglas.avisoCreditoDias);
  const avisos = db && yo ? db.avisos.filter((a) => a.usuarioId === yo.id).sort((a, b) => b.fecha.localeCompare(a.fecha)) : [];
  const sinLeer = avisos.filter((a) => !a.leido).length;
  const activo = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <Backdrop />
      <div className="app">
        <header className="top">
          <div className="top-in">
            <button className="icon-btn burger" onClick={() => setDrawer(true)} aria-label="Abrir menú">
              <Menu size={20} />
            </button>
            <Link href="/" className="brand" aria-label={`${marca.nombre}, inicio`}>
              <Marca_ marca={marca} />
              <span>
                {marca.nombre}
                <small>{marca.lema}</small>
              </span>
            </Link>
            <nav className="nav" aria-label="Principal">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={activo(n.href) ? "on" : ""}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="top-right">
              {yo && (
                <Link href="/panel?tab=creditos" className={`pill-credit ${porVencer ? "warn" : ""}`} title={porVencer && proximo ? `${proximo.restantes} vencen el ${fechaCorta(proximo.venceEl)}` : "Sus créditos"}>
                  <span className="coin">
                    <Coins size={13} />
                  </span>
                  {creditos} <span className="t">{creditos === 1 ? "crédito" : "créditos"}</span>
                </Link>
              )}
              <div className="relative" ref={bellRef}>
                <button
                  className="icon-btn"
                  aria-label="Avisos"
                  onClick={() => {
                    setBell((b) => !b);
                    setMenu(false);
                  }}
                >
                  <Bell size={19} />
                  {sinLeer > 0 && <span className="dot">{sinLeer}</span>}
                </button>
                {bell && (
                  <div className="menu-pop" style={{ width: 370 }}>
                    <div className="row" style={{ padding: "6px 10px 10px" }}>
                      <b>Avisos</b>
                      <span className="spacer" />
                      {sinLeer > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={marcarLeidos}>
                          Marcar como leídos
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 360, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                      {avisos.length === 0 && <p className="muted small" style={{ padding: 12 }}>Sin avisos por ahora.</p>}
                      {avisos.slice(0, 12).map((a) => (
                        <Link key={a.id} href={a.href ?? "/panel"} className={`notif ${a.leido ? "" : "unread"}`}>
                          {a.tipo === "credito" ? <Coins size={17} color="var(--accent)" /> : a.tipo === "contacto" ? <MessageCircle size={17} color="var(--wa)" /> : a.tipo === "cuenta" ? <BadgeCheck size={17} color="var(--ok)" /> : <Clock3 size={17} color="var(--sup)" />}
                          <span>
                            {a.texto}
                            <small>{fechaCorta(a.fecha)}</small>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {yo && (
                <div className="relative" ref={menuRef}>
                  <button
                    className="me"
                    onClick={() => {
                      setMenu((m) => !m);
                      setBell(false);
                    }}
                    aria-label="Mi cuenta"
                  >
                    <Avatar foto={yo.foto} size={32} alt={yo.nombre} />
                    <b>{yo.nombre}</b>
                  </button>
                  {menu && (
                    <div className="menu-pop" style={{ width: 280 }}>
                      <div style={{ padding: "8px 12px 12px" }}>
                        <b>{yo.nombre}</b>
                        <div className="muted small">{yo.negocio}</div>
                        {yo.whatsappVerificado && (
                          <span className="badge ok" style={{ marginTop: 6 }}>
                            <BadgeCheck size={12} /> WhatsApp confirmado
                          </span>
                        )}
                      </div>
                      <Link href="/panel">
                        <LayoutDashboard size={17} /> Mi panel
                      </Link>
                      <Link href="/panel?tab=creditos">
                        <Coins size={17} /> Mis créditos
                      </Link>
                      <Link href="/registro">
                        <UserPlus size={17} /> Crear otra cuenta
                      </Link>
                      <Link href="/admin">
                        <Settings2 size={17} /> Administración
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        {db && db.hoy !== db.hoyReal && (
          <div style={{ background: "var(--sup)", color: "#fff", fontSize: 13.5, fontWeight: 700 }}>
            <div className="wrap row" style={{ padding: "8px 20px", flexWrap: "wrap" }}>
              <CalendarClock size={16} /> Calendario adelantado a {fechaDia(db.hoy)}.
              <Link href="/admin" style={{ textDecoration: "underline" }}>
                Volver a hoy
              </Link>
            </div>
          </div>
        )}

        <div className={`scrim ${drawer ? "show" : ""}`} onClick={() => setDrawer(false)} />
        <aside className={`drawer ${drawer ? "open" : ""}`} aria-hidden={!drawer}>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="brand">
              <Marca_ marca={marca} />
              {marca.nombre}
            </span>
            <span className="spacer" />
            <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Cerrar menú">
              <X size={20} />
            </button>
          </div>
          <Link href="/" className={path === "/" ? "on" : ""}>
            <Boxes size={19} /> Inicio
          </Link>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={activo(n.href) ? "on" : ""}>
              <n.icon size={19} /> {n.label}
            </Link>
          ))}
          <Link href="/registro" className={activo("/registro") ? "on" : ""}>
            <UserPlus size={19} /> Crear cuenta
          </Link>
        </aside>

        <main className="main" style={{ flex: 1 }}>
          {children}
        </main>

        <footer className="foot">
          <div className="foot-in">
            <div>
              <div className="brand" style={{ color: "#fff" }}>
                <Marca_ marca={marca} />
                {marca.nombre}
              </div>
              <p style={{ marginTop: 12, fontSize: 14, color: "#c4d3d8", maxWidth: 300 }}>
                Material, herramienta y maquinaria que sobró de una obra, a la vista de quien lo necesita cerca. Buscar es gratis y el trato se cierra directo por WhatsApp.
              </p>
            </div>
            <div>
              <h4>Comprar</h4>
              <Link href="/buscar">Buscar material</Link>
              <Link href="/buscar?cat=obra-negra">Obra negra</Link>
              <Link href="/buscar?cat=maquinaria">Maquinaria y equipo</Link>
              <Link href="/buscar?cat=herramienta">Herramienta</Link>
            </div>
            <div>
              <h4>Vender</h4>
              <Link href="/publicar">Publicar anuncio</Link>
              <Link href="/panel">Mi panel</Link>
              <Link href="/panel?tab=creditos">Comprar créditos</Link>
              <Link href="/#como-funciona">Cómo funciona</Link>
            </div>
            <div>
              <h4>Cuenta</h4>
              <Link href="/registro">Crear cuenta</Link>
              <Link href="/admin">Administración</Link>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 {marca.nombre}. El sitio no interviene en pagos, entregas ni negociaciones entre las partes.</span>
            <span>Fotos: Unsplash · Mapa: Natural Earth</span>
          </div>
        </footer>
      </div>
      <Toasts />
    </>
  );
}
