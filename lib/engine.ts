import type { Anuncio, Db, LoteCreditos, TipoMovimiento, Ubicacion } from "./types";
import { diasEntre, fechaCorta, normalizar, sumarDias } from "./format";
import { distanciaKm, RADIOS, ubicacion } from "./geo";
import { SINONIMOS } from "./mock/categorias";

export const nuevoId = (db: Db, p: string) => `${p}-${++db.seq}`;

// ---------------- créditos ----------------

// Un lote sirve mientras le queden créditos y no haya pasado su último día.
export const loteVigente = (l: LoteCreditos, hoy: string) => l.restantes > 0 && l.venceEl >= hoy;

// El orden en que se gastan: primero el que vence antes. Así el regalo de 30 días
// se usa antes que lo pagado, y lo pagado más viejo antes que lo nuevo.
export function lotesEnOrden(db: Db, uid: string) {
  return db.lotes
    .filter((l) => l.usuarioId === uid && loteVigente(l, db.hoy))
    .sort((a, b) => a.venceEl.localeCompare(b.venceEl) || a.creadoEl.localeCompare(b.creadoEl));
}

export const saldo = (db: Db, uid: string) => lotesEnOrden(db, uid).reduce((s, l) => s + l.restantes, 0);

export type EstadoLote = "vigente" | "por-vencer" | "agotado" | "vencido";
export function estadoLote(l: LoteCreditos, db: Db): EstadoLote {
  if (l.restantes === 0) return l.vencidos > 0 ? "vencido" : "agotado";
  if (l.venceEl < db.hoy) return "vencido";
  if (diasEntre(db.hoy, l.venceEl) <= db.reglas.avisoCreditoDias) return "por-vencer";
  return "vigente";
}

export function consumir(db: Db, uid: string, n: number, tipo: TipoMovimiento, nota: string, anuncioId?: string) {
  if (saldo(db, uid) < n) return false;
  let falta = n;
  for (const l of lotesEnOrden(db, uid)) {
    if (!falta) break;
    const toma = Math.min(l.restantes, falta);
    l.restantes -= toma;
    falta -= toma;
    db.movimientos.push({ id: nuevoId(db, "M"), usuarioId: uid, loteId: l.id, tipo, cantidad: -toma, fecha: db.hoy, anuncioId, nota });
  }
  return true;
}

// ---------------- el paso de un día ----------------

function aviso(db: Db, uid: string, tipo: "credito" | "anuncio", texto: string, href: string) {
  db.avisos.push({ id: nuevoId(db, "AV"), usuarioId: uid, fecha: db.hoy, tipo, texto, leido: false, href });
}

const nombreDe = (db: Db, uid: string) => db.usuarios.find((u) => u.id === uid)?.nombre ?? uid;
export const delLote = (l: LoteCreditos) => (l.origen === "bienvenida" ? "del crédito de bienvenida" : `del ${l.nombre}`);
const creditos = (n: number) => `${n} ${n === 1 ? "crédito" : "créditos"}`;

export function correrDia(db: Db) {
  const r = db.reglas;
  for (const l of db.lotes) {
    if (l.restantes > 0 && l.venceEl < db.hoy) {
      const n = l.restantes;
      l.vencidos += n;
      l.restantes = 0;
      db.movimientos.push({ id: nuevoId(db, "M"), usuarioId: l.usuarioId, loteId: l.id, tipo: "vencimiento", cantidad: -n, fecha: db.hoy, nota: `${n === 1 ? "Venció" : "Vencieron"} ${creditos(n)} ${delLote(l)} sin usarse` });
      aviso(db, l.usuarioId, "credito", `${n === 1 ? "Venció" : "Vencieron"} ${creditos(n)} ${delLote(l)}. Los demás lotes siguen igual.`, "/panel?tab=creditos");
      db.eventos.push({ id: nuevoId(db, "EV"), fecha: db.hoy, tipo: "vence-credito", texto: `${n === 1 ? "Venció" : "Vencieron"} ${creditos(n)} ${delLote(l)} de ${nombreDe(db, l.usuarioId)}` });
    } else if (l.restantes > 0 && diasEntre(db.hoy, l.venceEl) === r.avisoCreditoDias) {
      aviso(db, l.usuarioId, "credito", `${creditos(l.restantes)} ${delLote(l)} ${l.restantes === 1 ? "vence" : "vencen"} el ${fechaCorta(l.venceEl)}. Se ${l.restantes === 1 ? "usa" : "usan"} primero cuando publique o renueve.`, "/panel?tab=creditos");
      db.eventos.push({ id: nuevoId(db, "EV"), fecha: db.hoy, tipo: "aviso", texto: `Aviso a ${nombreDe(db, l.usuarioId)}: ${creditos(l.restantes)} ${delLote(l)} vencen en ${r.avisoCreditoDias} días` });
    }
  }
  for (const a of db.anuncios) {
    const vivo = a.estado === "activo" || a.estado === "agotado" || a.estado === "pausado";
    if (vivo && a.venceEl < db.hoy) {
      a.estado = "vencido";
      aviso(db, a.vendedorId, "anuncio", `"${a.titulo}" cumplió su vigencia y ya no aparece en las búsquedas. Puede renovarlo desde su panel.`, "/panel");
      db.eventos.push({ id: nuevoId(db, "EV"), fecha: db.hoy, tipo: "vence-anuncio", texto: `Salió de las búsquedas: ${a.titulo}` });
    } else if (a.estado === "activo" && diasEntre(db.hoy, a.venceEl) === r.avisoAnuncioDias) {
      aviso(db, a.vendedorId, "anuncio", `"${a.titulo}" vence el ${fechaCorta(a.venceEl)}. Renovarlo cuesta ${r.renovacionCreditos} ${r.renovacionCreditos === 1 ? "crédito" : "créditos"}.`, "/panel");
      db.eventos.push({ id: nuevoId(db, "EV"), fecha: db.hoy, tipo: "aviso", texto: `Aviso de vigencia a ${nombreDe(db, a.vendedorId)}: ${a.titulo}` });
    }
  }
}

export function avanzarDias(db: Db, dias: number) {
  for (let i = 0; i < dias; i++) {
    db.hoy = sumarDias(db.hoy, 1);
    correrDia(db);
  }
}

// ---------------- búsqueda ----------------

export interface Filtros {
  q: string;
  catId: string;
  subId: string;
  condicion: string;
  factura: boolean;
  flete: boolean;
  orden: "distancia" | "precio-asc" | "precio-desc" | "recientes";
}

export const FILTROS_VACIOS: Filtros = { q: "", catId: "", subId: "", condicion: "", factura: false, flete: false, orden: "distancia" };

const raiz = (t: string) => (t.length > 4 && t.endsWith("es") ? t.slice(0, -2) : t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t);

export function expandir(q: string) {
  const palabras = normalizar(q).split(" ").filter((t) => t.length > 1 && !["de", "la", "el", "en", "para", "con", "y"].includes(t));
  const usados: { de: string; a: string }[] = [];
  const grupos = palabras.map((p) => {
    const r = raiz(p);
    const extra = SINONIMOS[p] ?? SINONIMOS[r] ?? [];
    extra.forEach((e) => usados.push({ de: p, a: e }));
    return [r, ...extra.map(raiz)];
  });
  return { grupos, usados };
}

function textoAnuncio(db: Db, a: Anuncio) {
  const cat = db.categorias.find((c) => c.id === a.catId);
  const sub = cat?.sub.find((s) => s.id === a.subId);
  return normalizar([a.titulo, sub?.nombre, cat?.nombre, ...Object.values(a.campos), a.descripcion].join(" "));
}

export function visible(a: Anuncio, hoy: string) {
  return a.estado === "activo" && a.cantidad > 0 && a.venceEl >= hoy;
}

export interface Resultado {
  a: Anuncio;
  km: number;
  u: Ubicacion;
}

export function buscar(db: Db, f: Filtros, origen: Ubicacion, radioKm: number | null, auto: boolean) {
  const { grupos, usados } = expandir(f.q);
  const base: Resultado[] = [];
  for (const a of db.anuncios) {
    if (!visible(a, db.hoy)) continue;
    if (f.catId && a.catId !== f.catId) continue;
    if (f.subId && a.subId !== f.subId) continue;
    if (f.condicion && a.condicion !== f.condicion) continue;
    if (f.factura && !a.factura) continue;
    if (f.flete && !a.flete) continue;
    if (grupos.length) {
      const t = textoAnuncio(db, a);
      if (!grupos.every((g) => g.some((w) => t.includes(w)))) continue;
    }
    const u = ubicacion(a.ubicacionId);
    base.push({ a, u, km: distanciaKm(origen, u) });
  }

  const conteos = RADIOS.map((r) => ({ ...r, n: r.km === null ? base.length : base.filter((x) => x.km <= r.km!).length }));
  let usado = radioKm;
  let ampliado = false;
  const dentro = (km: number | null) => base.filter((x) => km === null || x.km <= km);
  if (auto && dentro(usado).length < db.reglas.minResultados) {
    const idx = RADIOS.findIndex((r) => r.km === radioKm);
    for (let i = idx + 1; i < RADIOS.length; i++) {
      usado = RADIOS[i].km;
      ampliado = true;
      if (dentro(usado).length >= db.reglas.minResultados) break;
    }
  }
  const resultados = dentro(usado);
  const orden = {
    distancia: (x: Resultado, y: Resultado) => x.km - y.km,
    "precio-asc": (x: Resultado, y: Resultado) => x.a.precio - y.a.precio,
    "precio-desc": (x: Resultado, y: Resultado) => y.a.precio - x.a.precio,
    recientes: (x: Resultado, y: Resultado) => y.a.publicadoEl.localeCompare(x.a.publicadoEl),
  }[f.orden];
  resultados.sort(orden);
  const otrosEstados = resultados.filter((x) => x.u.estado !== origen.estado);
  return {
    resultados,
    conteos,
    radioUsado: usado,
    ampliado,
    enRadioPedido: dentro(radioKm).length,
    otrosEstados: otrosEstados.length,
    estadosVecinos: Array.from(new Set(otrosEstados.map((x) => x.u.estado))),
    sinonimos: usados,
    total: base.length,
  };
}

export function cercanos(db: Db, origen: Ubicacion, n: number, excluir?: string, subId?: string) {
  return db.anuncios
    .filter((a) => visible(a, db.hoy) && a.id !== excluir && (!subId || a.subId === subId))
    .map((a) => {
      const u = ubicacion(a.ubicacionId);
      return { a, u, km: distanciaKm(origen, u) };
    })
    .sort((x, y) => x.km - y.km)
    .slice(0, n);
}
