"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Anuncio, CampoPersonalizado, Db, MetodoPago, Pago, Paquete, Reglas, TipoVendedor, Usuario } from "./types";
import { semilla, VERSION } from "./seed";
import { hoyCentro, sumarDias, sumarMeses, wait, fechaCorta } from "./format";
import { avanzarDias, consumir, nuevoId, saldo } from "./engine";

export type ToastKind = "ok" | "error" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const CLAVE = "patio-de-obra:sesion";

// Avisa a las escenas 3D que algo cambió (un anuncio publicado, un crédito usado...)
export function pulso(tipo: "publicar" | "credito" | "cantidad" | "contacto" | "vencer" = "publicar") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("patio:pulso", { detail: tipo }));
}

export interface DatosAnuncio {
  titulo: string;
  catId: string;
  subId: string;
  campos: Record<string, string>;
  condicion: Anuncio["condicion"];
  precio: number;
  unidad: string;
  cantidad: number;
  minimo?: number;
  ubicacionId: string;
  fotos: string[];
  descripcion: string;
  factura: boolean;
  flete: boolean;
}

export interface DatosRegistro {
  nombre: string;
  negocio: string;
  tipo: TipoVendedor;
  telefono: string;
  email: string;
  ubicacionId: string;
}

function useStoreValue() {
  const [db, setDb] = useState<Db | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  useEffect(() => {
    const hoy = hoyCentro();
    let inicial: Db | null = null;
    try {
      const raw = window.sessionStorage.getItem(CLAVE);
      if (raw) {
        const x = JSON.parse(raw) as Db;
        if (x.version === VERSION && x.hoyReal === hoy) inicial = x;
      }
    } catch {}
    setDb(inicial ?? semilla(hoy));
  }, []);

  useEffect(() => {
    if (!db) return;
    const t = setTimeout(() => {
      try {
        window.sessionStorage.setItem(CLAVE, JSON.stringify(db));
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [db]);

  const toast = useCallback((text: string, kind: ToastKind = "ok") => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);
  const cerrarToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Todas las escrituras pasan por aquí: copia, cambia, reemplaza.
  const cambiar = useCallback((fn: (d: Db) => void) => {
    setDb((prev) => {
      if (!prev) return prev;
      const d = structuredClone(prev);
      fn(d);
      return d;
    });
  }, []);
  const dbRef = useRef(db);
  dbRef.current = db;

  const yo = db ? db.usuarios.find((u) => u.id === db.usuarioId)! : null;

  // ---------- anuncios ----------
  const publicar = useCallback(
    async (datos: DatosAnuncio): Promise<{ ok: true; id: string } | { ok: false; motivo: string }> => {
      await wait(900);
      const d0 = dbRef.current!;
      const costo = 1;
      if (saldo(d0, d0.usuarioId) < costo) return { ok: false, motivo: "sin-creditos" };
      let nuevo = "";
      cambiar((d) => {
        nuevo = `A-${++d.seq}`;
        const a: Anuncio = {
          ...datos,
          id: nuevo,
          cantidadInicial: datos.cantidad,
          vendedorId: d.usuarioId,
          publicadoEl: d.hoy,
          venceEl: sumarDias(d.hoy, d.reglas.anuncioDias),
          estado: "activo",
          vistas: 0,
          contactos: 0,
          renovaciones: 0,
        };
        consumir(d, d.usuarioId, costo, "publicacion", `Publicó "${a.titulo}"`, a.id);
        d.anuncios.unshift(a);
      });
      // el id se generó dentro del cambio; se recalcula igual que ahí
      nuevo = `A-${d0.seq + 1}`;
      pulso("publicar");
      return { ok: true, id: nuevo };
    },
    [cambiar],
  );

  const editarAnuncio = useCallback(
    async (id: string, datos: DatosAnuncio) => {
      await wait(700);
      cambiar((d) => {
        const a = d.anuncios.find((x) => x.id === id);
        if (!a) return;
        Object.assign(a, datos);
        if (a.cantidad === 0 && a.estado === "activo") a.estado = "agotado";
        if (a.cantidad > 0 && a.estado === "agotado") a.estado = "activo";
      });
      toast("Cambios guardados. El anuncio conserva su vigencia.");
    },
    [cambiar, toast],
  );

  const actualizarCantidad = useCallback(
    async (id: string, cantidad: number) => {
      await wait(500);
      cambiar((d) => {
        const a = d.anuncios.find((x) => x.id === id);
        if (!a) return;
        a.cantidad = Math.max(0, Math.round(cantidad));
        if (a.cantidad > a.cantidadInicial) a.cantidadInicial = a.cantidad;
        if (a.cantidad === 0 && a.estado === "activo") a.estado = "agotado";
        else if (a.cantidad > 0 && a.estado === "agotado") a.estado = "activo";
      });
      pulso("cantidad");
      toast(cantidad === 0 ? "Llegó a cero: el anuncio se pausó solo y ya no aparece en búsquedas." : "Cantidad actualizada.");
    },
    [cambiar, toast],
  );

  const renovar = useCallback(
    async (id: string) => {
      await wait(800);
      const d0 = dbRef.current!;
      const costo = d0.reglas.renovacionCreditos;
      if (saldo(d0, d0.usuarioId) < costo) {
        toast("No le quedan créditos para renovar. Puede comprar un paquete en la pestaña Créditos.", "error");
        return false;
      }
      let hasta = "";
      cambiar((d) => {
        const a = d.anuncios.find((x) => x.id === id);
        if (!a) return;
        const desde = a.venceEl >= d.hoy ? a.venceEl : d.hoy;
        a.venceEl = sumarDias(desde, d.reglas.anuncioDias);
        a.estado = a.cantidad > 0 ? "activo" : "agotado";
        a.renovaciones += 1;
        hasta = a.venceEl;
        consumir(d, d.usuarioId, costo, "renovacion", `Renovó "${a.titulo}"`, a.id);
      });
      const a0 = d0.anuncios.find((x) => x.id === id)!;
      const desde = a0.venceEl >= d0.hoy ? a0.venceEl : d0.hoy;
      hasta = sumarDias(desde, d0.reglas.anuncioDias);
      pulso("credito");
      toast(`Renovado hasta el ${fechaCorta(hasta)}. Se descontó del lote que vence primero.`);
      return true;
    },
    [cambiar, toast],
  );

  const cambiarEstado = useCallback(
    async (id: string, estado: Anuncio["estado"]) => {
      await wait(450);
      cambiar((d) => {
        const a = d.anuncios.find((x) => x.id === id);
        if (a) a.estado = estado;
      });
    },
    [cambiar],
  );

  const eliminarAnuncio = useCallback(
    async (id: string) => {
      await wait(600);
      cambiar((d) => {
        d.anuncios = d.anuncios.filter((x) => x.id !== id);
      });
      toast("Anuncio eliminado. El crédito usado no se devuelve.", "info");
    },
    [cambiar, toast],
  );

  const vistos = useRef(new Set<string>());
  const registrarVista = useCallback(
    (id: string) => {
      if (vistos.current.has(id)) return;
      vistos.current.add(id);
      cambiar((d) => {
        const a = d.anuncios.find((x) => x.id === id);
        if (a) a.vistas += 1;
      });
    },
    [cambiar],
  );

  const registrarContacto = useCallback(
    (id: string) => {
      cambiar((d) => {
        const a = d.anuncios.find((x) => x.id === id);
        if (!a) return;
        a.contactos += 1;
        if (a.vendedorId !== d.usuarioId) return;
        d.avisos.push({ id: nuevoId(d, "AV"), usuarioId: a.vendedorId, fecha: d.hoy, tipo: "contacto", texto: `Alguien abrió WhatsApp para escribirle por "${a.titulo}".`, leido: false, href: "/panel" });
      });
      pulso("contacto");
    },
    [cambiar],
  );

  // ---------- créditos y pagos ----------
  const comprar = useCallback(
    async (paqueteId: string, metodo: MetodoPago): Promise<Pago> => {
      await wait(metodo === "tarjeta" ? 1400 : 900);
      const d0 = dbRef.current!;
      const pq = d0.paquetes.find((p) => p.id === paqueteId)!;
      const pagoId = `PG-${d0.seq + 1}`;
      const referencia = metodo === "oxxo" ? `9301 ${String(4000 + d0.seq).padStart(4, "0")} 5512 ${String(1000 + (d0.seq % 9000)).padStart(4, "0")}` : metodo === "spei" ? `646180${String(1576000000 + d0.seq)}` : undefined;
      const estado: Pago["estado"] = metodo === "tarjeta" ? "pagado" : "pendiente";
      const pago: Pago = { id: pagoId, usuarioId: d0.usuarioId, paqueteId, creditos: pq.creditos, monto: pq.precio, metodo, fecha: d0.hoy, estado, referencia };
      cambiar((d) => {
        d.seq += 1;
        d.pagos.push({ ...pago });
        if (estado === "pagado") acreditar(d, pago, pq);
      });
      if (estado === "pagado") {
        pulso("credito");
        toast(`Pago aprobado. Sumó ${pq.creditos} ${pq.creditos === 1 ? "crédito que vence" : "créditos que vencen"} el ${fechaCorta(sumarMeses(d0.hoy, d0.reglas.compraMeses))}.`);
      }
      return pago;
    },
    [cambiar, toast],
  );

  const confirmarPago = useCallback(
    async (pagoId: string) => {
      await wait(1300);
      const d0 = dbRef.current!;
      const p = d0.pagos.find((x) => x.id === pagoId);
      if (!p || p.estado === "pagado") return;
      const pq = d0.paquetes.find((x) => x.id === p.paqueteId)!;
      cambiar((d) => {
        const pp = d.pagos.find((x) => x.id === pagoId)!;
        pp.estado = "pagado";
        acreditar(d, pp, pq);
      });
      pulso("credito");
      toast(`Pago recibido. Sumó ${pq.creditos} ${pq.creditos === 1 ? "crédito que vence" : "créditos que vencen"} el ${fechaCorta(sumarMeses(d0.hoy, d0.reglas.compraMeses))}.`);
    },
    [cambiar, toast],
  );

  // ---------- cuentas ----------
  const registrar = useCallback(
    async (datos: DatosRegistro) => {
      await wait(900);
      const d0 = dbRef.current!;
      const repetido = d0.usuarios.find((u) => u.telefono === datos.telefono && u.bienvenida === "otorgada");
      const uid = `u${d0.seq + 1}`;
      cambiar((d) => {
        d.seq += 1;
        const u: Usuario = {
          id: uid,
          ...datos,
          foto: "",
          registradoEl: d.hoy,
          whatsappVerificado: true,
          bienvenida: repetido ? "bloqueada" : "otorgada",
          rol: "vendedor",
        };
        d.usuarios.push(u);
        d.usuarioId = uid;
        if (!repetido) {
          const lote = {
            id: nuevoId(d, "L"),
            usuarioId: uid,
            origen: "bienvenida" as const,
            nombre: "Crédito de bienvenida",
            cantidad: d.reglas.bienvenidaCreditos,
            restantes: d.reglas.bienvenidaCreditos,
            vencidos: 0,
            creadoEl: d.hoy,
            venceEl: sumarDias(d.hoy, d.reglas.bienvenidaDias),
          };
          d.lotes.push(lote);
          d.movimientos.push({ id: nuevoId(d, "M"), usuarioId: uid, loteId: lote.id, tipo: "bienvenida", cantidad: lote.cantidad, fecha: d.hoy, nota: "Regalo al confirmar su WhatsApp" });
          d.avisos.push({ id: nuevoId(d, "AV"), usuarioId: uid, fecha: d.hoy, tipo: "cuenta", texto: `Bienvenido. Tiene ${lote.cantidad} ${lote.cantidad === 1 ? "crédito" : "créditos"} de regalo hasta el ${fechaCorta(lote.venceEl)}.`, leido: false, href: "/publicar" });
        } else {
          d.avisos.push({ id: nuevoId(d, "AV"), usuarioId: uid, fecha: d.hoy, tipo: "cuenta", texto: "Su cuenta quedó lista. Este WhatsApp ya había recibido el crédito de bienvenida, así que el regalo no se repite.", leido: false, href: "/panel?tab=creditos" });
        }
      });
      pulso("credito");
      return { uid, bloqueado: !!repetido, desde: repetido?.registradoEl };
    },
    [cambiar],
  );

  const verComo = useCallback(
    (uid: string) => {
      cambiar((d) => {
        d.usuarioId = uid;
      });
      const u = dbRef.current?.usuarios.find((x) => x.id === uid);
      if (u) toast(`Ahora ve el sitio como ${u.nombre}.`, "info");
    },
    [cambiar, toast],
  );

  const telefonoUsado = useCallback((tel: string) => {
    const d = dbRef.current;
    return d ? d.usuarios.find((u) => u.telefono === tel && u.bienvenida === "otorgada") ?? null : null;
  }, []);

  const marcarLeidos = useCallback(() => {
    cambiar((d) => {
      d.avisos.forEach((a) => {
        if (a.usuarioId === d.usuarioId) a.leido = true;
      });
    });
  }, [cambiar]);

  const fijarUbicacion = useCallback(
    (id: string) => {
      cambiar((d) => {
        d.busquedaUbicacionId = id;
      });
    },
    [cambiar],
  );

  // ---------- administración ----------
  const avanzar = useCallback(
    async (dias: number) => {
      await wait(600);
      const antes = dbRef.current!.eventos.length;
      let despues = antes;
      cambiar((d) => {
        avanzarDias(d, dias);
        despues = d.eventos.length;
      });
      pulso("vencer");
      return { antes, despues };
    },
    [cambiar],
  );

  const guardarReglas = useCallback(
    async (reglas: Reglas, paquetes: Paquete[]) => {
      await wait(700);
      cambiar((d) => {
        d.reglas = reglas;
        d.paquetes = paquetes;
      });
      toast("Reglas guardadas. Aplican a lo que se publique o compre desde hoy.");
    },
    [cambiar, toast],
  );

  const agregarSub = useCallback(
    async (catId: string, nombre: string, unidad: string) => {
      await wait(500);
      cambiar((d) => {
        const c = d.categorias.find((x) => x.id === catId);
        if (!c) return;
        const id = nombre
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        c.sub.push({ id: `${id}-${d.seq + 1}`, nombre, unidades: [unidad], campos: [], fotos: c.sub[0]?.fotos ?? [] });
        d.seq += 1;
      });
      toast(`Subcategoría "${nombre}" creada.`);
    },
    [cambiar, toast],
  );

  const agregarCampo = useCallback(
    async (catId: string, subId: string, campo: CampoPersonalizado) => {
      await wait(450);
      cambiar((d) => {
        const s = d.categorias.find((x) => x.id === catId)?.sub.find((x) => x.id === subId);
        if (s) s.campos.push(campo);
      });
      toast(`Campo "${campo.etiqueta}" agregado. Ya aparece al publicar.`);
    },
    [cambiar, toast],
  );

  const quitarCampo = useCallback(
    async (catId: string, subId: string, campoId: string) => {
      await wait(350);
      cambiar((d) => {
        const s = d.categorias.find((x) => x.id === catId)?.sub.find((x) => x.id === subId);
        if (s) s.campos = s.campos.filter((c) => c.id !== campoId);
      });
      toast("Campo eliminado.", "info");
    },
    [cambiar, toast],
  );

  const reiniciar = useCallback(() => {
    const hoy = hoyCentro();
    try {
      window.sessionStorage.removeItem(CLAVE);
    } catch {}
    setDb(semilla(hoy));
    toast("Datos restablecidos al día de hoy.", "info");
  }, [toast]);

  return useMemo(
    () => ({
      db,
      yo,
      listo: !!db,
      toasts,
      toast,
      cerrarToast,
      publicar,
      editarAnuncio,
      actualizarCantidad,
      renovar,
      cambiarEstado,
      eliminarAnuncio,
      registrarVista,
      registrarContacto,
      comprar,
      confirmarPago,
      registrar,
      verComo,
      telefonoUsado,
      marcarLeidos,
      fijarUbicacion,
      avanzar,
      guardarReglas,
      agregarSub,
      agregarCampo,
      quitarCampo,
      reiniciar,
    }),
    [db, yo, toasts, toast, cerrarToast, publicar, editarAnuncio, actualizarCantidad, renovar, cambiarEstado, eliminarAnuncio, registrarVista, registrarContacto, comprar, confirmarPago, registrar, verComo, telefonoUsado, marcarLeidos, fijarUbicacion, avanzar, guardarReglas, agregarSub, agregarCampo, quitarCampo, reiniciar],
  );
}

function acreditar(d: Db, pago: Pago, pq: Paquete) {
  const lote = {
    id: nuevoId(d, "L"),
    usuarioId: pago.usuarioId,
    origen: "compra" as const,
    nombre: pq.nombre,
    cantidad: pq.creditos,
    restantes: pq.creditos,
    vencidos: 0,
    creadoEl: d.hoy,
    venceEl: sumarMeses(d.hoy, d.reglas.compraMeses),
    pagoId: pago.id,
  };
  d.lotes.push(lote);
  const como = pago.metodo === "tarjeta" ? "Pago con tarjeta" : pago.metodo === "oxxo" ? "Pago en efectivo en OXXO" : "Transferencia SPEI";
  d.movimientos.push({ id: nuevoId(d, "M"), usuarioId: pago.usuarioId, loteId: lote.id, tipo: "compra", cantidad: pq.creditos, fecha: d.hoy, nota: como });
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fuera de StoreProvider");
  return v;
}
