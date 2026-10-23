import type { ISODate } from "./types";

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fechas como días calendario. Todo se calcula en UTC para que un día nunca "salte"
// por el huso del navegador; el día de hoy se toma en hora del centro de México.
export function hoyCentro(): ISODate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
}

function toDate(d: ISODate) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}
function fromDate(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function sumarDias(d: ISODate, n: number): ISODate {
  const x = toDate(d);
  x.setUTCDate(x.getUTCDate() + n);
  return fromDate(x);
}

// Meses de calendario: el 31 de agosto más seis meses es el último día de febrero.
export function sumarMeses(d: ISODate, n: number): ISODate {
  const x = toDate(d);
  const dia = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  const ultimo = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
  x.setUTCDate(Math.min(dia, ultimo));
  return fromDate(x);
}

export function diasEntre(a: ISODate, b: ISODate) {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
}

const fCorta = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
const fLarga = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fDia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const limpia = (s: string) => s.replace(/\./g, "");
export const fechaCorta = (d: ISODate) => limpia(fCorta.format(toDate(d)));
export const fechaLarga = (d: ISODate) => limpia(fLarga.format(toDate(d)));
export const fechaDia = (d: ISODate) => {
  const s = fDia.format(toDate(d));
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function haceDias(desde: ISODate, hoy: ISODate) {
  const n = diasEntre(desde, hoy);
  if (n <= 0) return "hoy";
  if (n === 1) return "ayer";
  if (n < 7) return `hace ${n} días`;
  if (n < 14) return "hace una semana";
  if (n < 31) return `hace ${Math.floor(n / 7)} semanas`;
  const m = Math.floor(n / 30);
  return m <= 1 ? "hace un mes" : `hace ${m} meses`;
}

export function faltan(hasta: ISODate, hoy: ISODate) {
  const n = diasEntre(hoy, hasta);
  if (n < 0) return n === -1 ? "venció ayer" : `venció hace ${-n} días`;
  if (n === 0) return "vence hoy";
  if (n === 1) return "vence mañana";
  return `vence en ${n} días`;
}

const mxn0 = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const mxn2 = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pesos = (n: number) => (Number.isInteger(n) ? mxn0.format(n) : mxn2.format(n));

const num = new Intl.NumberFormat("es-MX");
export const numero = (n: number) => num.format(n);

// "bulto" -> "bultos", "m³" se queda igual
export function plural(unidad: string, n: number): string {
  if (n === 1) return unidad;
  const fijo: Record<string, string> = { kg: "kg", galón: "galones" };
  if (fijo[unidad]) return fijo[unidad];
  if (/[³²]$/.test(unidad) || unidad.includes(" ")) {
    const [a, ...rest] = unidad.split(" ");
    if (rest.length && !/[³²]$/.test(a)) return `${plural(a, n)} ${rest.join(" ")}`;
    return unidad;
  }
  if (/[aeiouáéó]$/i.test(unidad)) return unidad + "s";
  if (unidad.endsWith("z")) return unidad.slice(0, -1) + "ces";
  return unidad + "es";
}

export const cantidadUnidad = (n: number, unidad: string) => `${numero(n)} ${plural(unidad, n)}`;

export const enmascararTel = (t: string) => `${t.slice(0, 2)} •••• ${t.slice(-4)}`;

export function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ/\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
