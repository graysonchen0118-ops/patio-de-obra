import type { Anuncio, Aviso, Db, LoteCreditos, Movimiento, Pago, Paquete, Reglas, Usuario, MetodoPago } from "./types";
import { CATEGORIAS } from "./mock/categorias";
import { USUARIOS } from "./mock/usuarios";
import { ANUNCIOS } from "./mock/anuncios";
import { sumarDias, sumarMeses, fechaCorta } from "./format";

export const VERSION = 5;

export const REGLAS_BASE: Reglas = {
  bienvenidaCreditos: 1,
  bienvenidaDias: 30,
  compraMeses: 6,
  anuncioDias: 30,
  renovacionCreditos: 1,
  avisoCreditoDias: 7,
  avisoAnuncioDias: 3,
  minResultados: 3,
};

export const PAQUETES_BASE: Paquete[] = [
  { id: "p1", nombre: "Crédito suelto", creditos: 1, precio: 59 },
  { id: "p5", nombre: "Paquete 5", creditos: 5, precio: 265 },
  { id: "p10", nombre: "Paquete 10", creditos: 10, precio: 490, destacado: true },
  { id: "p25", nombre: "Paquete 25", creditos: 25, precio: 1125 },
];

export function subDe(subId: string, categorias = CATEGORIAS) {
  for (const c of categorias) {
    const s = c.sub.find((x) => x.id === subId);
    if (s) return { cat: c, sub: s };
  }
  return { cat: categorias[0], sub: categorias[0].sub[0] };
}

export function semilla(hoy: string): Db {
  const reglas = { ...REGLAS_BASE };
  const paquetes = PAQUETES_BASE.map((p) => ({ ...p }));
  let n = 0;
  const id = (p: string) => `${p}-${++n}`;

  const usuarios: Usuario[] = USUARIOS.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    negocio: u.negocio,
    tipo: u.tipo,
    foto: u.foto,
    ubicacionId: u.ubicacionId,
    telefono: u.telefono,
    email: u.email,
    registradoEl: sumarDias(hoy, -u.registro),
    whatsappVerificado: true,
    bienvenida: u.bienvenida,
    rol: "vendedor",
  }));

  const anuncios: Anuncio[] = ANUNCIOS.map((s) => {
    const { cat } = subDe(s.sub);
    const publicadoEl = sumarDias(hoy, -s.d);
    const venceEl = sumarDias(publicadoEl, reglas.anuncioDias);
    const estado = s.estado ?? (venceEl < hoy ? "vencido" : "activo");
    return {
      id: s.id,
      titulo: s.titulo,
      catId: cat.id,
      subId: s.sub,
      campos: s.campos,
      condicion: s.condicion,
      precio: s.precio,
      unidad: s.unidad,
      cantidad: s.cantidad,
      cantidadInicial: s.inicial ?? s.cantidad,
      minimo: s.minimo,
      vendedorId: s.vendedor,
      ubicacionId: s.lugar,
      fotos: s.fotos,
      descripcion: s.desc,
      publicadoEl,
      venceEl,
      estado,
      vistas: s.vistas,
      contactos: s.contactos,
      factura: s.factura,
      flete: s.flete,
      renovaciones: 0,
    };
  });

  const lotes: LoteCreditos[] = [];
  const movimientos: Movimiento[] = [];
  const pagos: Pago[] = [];
  const avisos: Aviso[] = [];

  const lote = (l: Omit<LoteCreditos, "id">) => {
    const x = { ...l, id: id("L") };
    lotes.push(x);
    return x;
  };
  const mov = (m: Omit<Movimiento, "id">) => movimientos.push({ ...m, id: id("M") });
  const pago = (p: Omit<Pago, "id">) => {
    const x = { ...p, id: id("PG") };
    pagos.push(x);
    return x;
  };
  const metodos: MetodoPago[] = ["tarjeta", "oxxo", "spei"];

  // ---------- la cuenta del panel: Constructora Benítez Arcos ----------
  const u1 = usuarios[0];
  const b1 = lote({ usuarioId: "u1", origen: "bienvenida", nombre: "Crédito de bienvenida", cantidad: 1, restantes: 0, vencidos: 0, creadoEl: u1.registradoEl, venceEl: sumarDias(u1.registradoEl, reglas.bienvenidaDias) });
  mov({ usuarioId: "u1", loteId: b1.id, tipo: "bienvenida", cantidad: 1, fecha: u1.registradoEl, nota: "Regalo al confirmar su WhatsApp" });
  mov({ usuarioId: "u1", loteId: b1.id, tipo: "publicacion", cantidad: -1, fecha: sumarDias(u1.registradoEl, 1), nota: 'Publicó "Varilla de 1/2", 40 piezas" (vendido)' });

  const c10 = sumarDias(sumarMeses(hoy, -6), 6);
  const p10 = pago({ usuarioId: "u1", paqueteId: "p10", creditos: 10, monto: 490, metodo: "tarjeta", fecha: c10, estado: "pagado" });
  const l10 = lote({ usuarioId: "u1", origen: "compra", nombre: "Paquete 10", cantidad: 10, restantes: 3, vencidos: 0, creadoEl: c10, venceEl: sumarMeses(c10, reglas.compraMeses), pagoId: p10.id });
  mov({ usuarioId: "u1", loteId: l10.id, tipo: "compra", cantidad: 10, fecha: c10, nota: "Pago con tarjeta" });
  mov({ usuarioId: "u1", loteId: l10.id, tipo: "publicacion", cantidad: -1, fecha: sumarDias(c10, 15), nota: 'Publicó "Arena de río, 7 m³" (vendido)' });

  const c25 = sumarDias(hoy, -25);
  const p25 = pago({ usuarioId: "u1", paqueteId: "p25", creditos: 25, monto: 1125, metodo: "oxxo", fecha: c25, estado: "pagado", referencia: "9301 2847 5512 0391" });
  const l25 = lote({ usuarioId: "u1", origen: "compra", nombre: "Paquete 25", cantidad: 25, restantes: 25, vencidos: 0, creadoEl: c25, venceEl: sumarMeses(c25, reglas.compraMeses), pagoId: p25.id });
  mov({ usuarioId: "u1", loteId: l25.id, tipo: "compra", cantidad: 25, fecha: c25, nota: "Pago en efectivo en OXXO" });

  // las publicaciones de la cuenta salieron del lote que vence primero
  anuncios
    .filter((a) => a.vendedorId === "u1")
    .sort((a, b) => a.publicadoEl.localeCompare(b.publicadoEl))
    .forEach((a) => mov({ usuarioId: "u1", loteId: l10.id, tipo: "publicacion", cantidad: -1, fecha: a.publicadoEl, anuncioId: a.id, nota: `Publicó "${a.titulo}"` }));

  // ---------- el resto de los vendedores ----------
  usuarios.slice(1).forEach((u, i) => {
    if (u.bienvenida === "bloqueada") return;
    const suyos = anuncios.filter((a) => a.vendedorId === u.id);
    const registro = u.registradoEl;
    const bv = lote({ usuarioId: u.id, origen: "bienvenida", nombre: "Crédito de bienvenida", cantidad: 1, restantes: 0, vencidos: 0, creadoEl: registro, venceEl: sumarDias(registro, reglas.bienvenidaDias) });
    mov({ usuarioId: u.id, loteId: bv.id, tipo: "bienvenida", cantidad: 1, fecha: registro, nota: "Regalo al confirmar su WhatsApp" });
    if (u.id === "u23") {
      bv.restantes = 1; // registro reciente, el regalo sigue sin usar
    } else if (u.id === "u17" || u.id === "u10") {
      bv.vencidos = 1;
      mov({ usuarioId: u.id, loteId: bv.id, tipo: "vencimiento", cantidad: -1, fecha: sumarDias(bv.venceEl, 1), nota: "Venció sin usarse" });
    } else {
      mov({ usuarioId: u.id, loteId: bv.id, tipo: "publicacion", cantidad: -1, fecha: sumarDias(registro, 1), nota: "Primer anuncio" });
    }
    if (!suyos.length) return;

    // una compra vieja ya agotada, para que la historia de ventas tenga forma
    if (i % 2 === 0) {
      const f = sumarDias(hoy, -(38 + ((i * 9) % 30)));
      if (f > registro) {
        const pq = paquetes[1];
        const pg = pago({ usuarioId: u.id, paqueteId: pq.id, creditos: pq.creditos, monto: pq.precio, metodo: metodos[(i + 1) % 3], fecha: f, estado: "pagado" });
        const lv = lote({ usuarioId: u.id, origen: "compra", nombre: pq.nombre, cantidad: pq.creditos, restantes: 0, vencidos: 0, creadoEl: f, venceEl: sumarMeses(f, reglas.compraMeses), pagoId: pg.id });
        mov({ usuarioId: u.id, loteId: lv.id, tipo: "compra", cantidad: pq.creditos, fecha: f, nota: "Compra" });
      }
    }

    const primera = suyos.reduce((m, a) => (a.publicadoEl < m ? a.publicadoEl : m), hoy);
    const f = sumarDias(primera, -(1 + (i % 4)));
    const pq = suyos.length > 3 ? paquetes[2] : paquetes[1];
    const pg = pago({ usuarioId: u.id, paqueteId: pq.id, creditos: pq.creditos, monto: pq.precio, metodo: metodos[i % 3], fecha: f, estado: "pagado" });
    const lc = lote({ usuarioId: u.id, origen: "compra", nombre: pq.nombre, cantidad: pq.creditos, restantes: pq.creditos - suyos.length, vencidos: 0, creadoEl: f, venceEl: sumarMeses(f, reglas.compraMeses), pagoId: pg.id });
    mov({ usuarioId: u.id, loteId: lc.id, tipo: "compra", cantidad: pq.creditos, fecha: f, nota: "Compra" });
    suyos.forEach((a) => mov({ usuarioId: u.id, loteId: lc.id, tipo: "publicacion", cantidad: -1, fecha: a.publicadoEl, anuncioId: a.id, nota: `Publicó "${a.titulo}"` }));
  });

  // ---------- avisos de la cuenta del panel ----------
  const aviso = (a: Omit<Aviso, "id" | "usuarioId">) => avisos.push({ ...a, id: id("AV"), usuarioId: "u1" });
  const a1001 = anuncios.find((a) => a.id === "A-1001")!;
  const a1005 = anuncios.find((a) => a.id === "A-1005")!;
  aviso({ fecha: hoy, tipo: "contacto", texto: "Alguien de Tlalnepantla le escribió por WhatsApp por el block hueco 12x20x40.", leido: false, href: "/panel" });
  aviso({ fecha: sumarDias(l10.venceEl, -reglas.avisoCreditoDias), tipo: "credito", texto: `3 créditos del Paquete 10 vencen el ${fechaCorta(l10.venceEl)}. Se usan primero cuando publique o renueve.`, leido: false, href: "/panel?tab=creditos" });
  aviso({ fecha: sumarDias(a1001.venceEl, -reglas.avisoAnuncioDias), tipo: "anuncio", texto: `Su anuncio "${a1001.titulo}" vence el ${fechaCorta(a1001.venceEl)}. Renovarlo cuesta 1 crédito y no pierde los días que le quedan.`, leido: false, href: "/panel" });
  aviso({ fecha: sumarDias(hoy, -15), tipo: "anuncio", texto: 'El cimbraplay de 16 mm llegó a cero hojas y se pausó solo. Si consigue más, actualice la cantidad y vuelve a aparecer.', leido: true, href: "/panel" });
  aviso({ fecha: sumarDias(a1005.venceEl, 1), tipo: "anuncio", texto: `"${a1005.titulo}" venció y ya no aparece en las búsquedas. Puede renovarlo desde su panel.`, leido: true, href: "/panel" });

  return {
    version: VERSION,
    hoy,
    hoyReal: hoy,
    usuarioId: "u1",
    usuarios,
    categorias: JSON.parse(JSON.stringify(CATEGORIAS)),
    anuncios,
    lotes,
    movimientos,
    pagos,
    paquetes,
    reglas,
    avisos,
    eventos: [],
    seq: 2000,
    busquedaUbicacionId: "naucalpan",
  };
}
