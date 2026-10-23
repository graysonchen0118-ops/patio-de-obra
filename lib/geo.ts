import type { Ubicacion } from "./types";

// Centro aproximado de cada municipio o alcaldía, con un código postal de referencia.
// En el sitio real esto sale del catálogo nacional de códigos postales con coordenadas.
export const UBICACIONES: Ubicacion[] = [
  { id: "azcapotzalco", municipio: "Azcapotzalco", estado: "Ciudad de México", cp: "02000", lat: 19.4869, lng: -99.1847 },
  { id: "gam", municipio: "Gustavo A. Madero", estado: "Ciudad de México", cp: "07000", lat: 19.4827, lng: -99.1131 },
  { id: "cuauhtemoc", municipio: "Cuauhtémoc", estado: "Ciudad de México", cp: "06000", lat: 19.4326, lng: -99.1460 },
  { id: "miguel-hidalgo", municipio: "Miguel Hidalgo", estado: "Ciudad de México", cp: "11000", lat: 19.4280, lng: -99.2026 },
  { id: "benito-juarez", municipio: "Benito Juárez", estado: "Ciudad de México", cp: "03100", lat: 19.3727, lng: -99.1586 },
  { id: "coyoacan", municipio: "Coyoacán", estado: "Ciudad de México", cp: "04000", lat: 19.3467, lng: -99.1617 },
  { id: "iztapalapa", municipio: "Iztapalapa", estado: "Ciudad de México", cp: "09000", lat: 19.3574, lng: -99.0928 },
  { id: "alvaro-obregon", municipio: "Álvaro Obregón", estado: "Ciudad de México", cp: "01000", lat: 19.3587, lng: -99.2033 },
  { id: "tlalpan", municipio: "Tlalpan", estado: "Ciudad de México", cp: "14000", lat: 19.2950, lng: -99.1660 },
  { id: "xochimilco", municipio: "Xochimilco", estado: "Ciudad de México", cp: "16000", lat: 19.2620, lng: -99.1060 },
  { id: "cuajimalpa", municipio: "Cuajimalpa", estado: "Ciudad de México", cp: "05000", lat: 19.3570, lng: -99.2990 },
  { id: "naucalpan", municipio: "Naucalpan de Juárez", estado: "Estado de México", cp: "53000", lat: 19.4785, lng: -99.2396 },
  { id: "tlalnepantla", municipio: "Tlalnepantla de Baz", estado: "Estado de México", cp: "54000", lat: 19.5400, lng: -99.1950 },
  { id: "ecatepec", municipio: "Ecatepec de Morelos", estado: "Estado de México", cp: "55000", lat: 19.6010, lng: -99.0500 },
  { id: "neza", municipio: "Nezahualcóyotl", estado: "Estado de México", cp: "57000", lat: 19.4006, lng: -99.0148 },
  { id: "izcalli", municipio: "Cuautitlán Izcalli", estado: "Estado de México", cp: "54700", lat: 19.6470, lng: -99.2460 },
  { id: "atizapan", municipio: "Atizapán de Zaragoza", estado: "Estado de México", cp: "52900", lat: 19.5590, lng: -99.2670 },
  { id: "huixquilucan", municipio: "Huixquilucan", estado: "Estado de México", cp: "52760", lat: 19.3610, lng: -99.3500 },
  { id: "texcoco", municipio: "Texcoco", estado: "Estado de México", cp: "56100", lat: 19.5130, lng: -98.8820 },
  { id: "toluca", municipio: "Toluca", estado: "Estado de México", cp: "50000", lat: 19.2826, lng: -99.6557 },
  { id: "metepec", municipio: "Metepec", estado: "Estado de México", cp: "52140", lat: 19.2510, lng: -99.6040 },
  { id: "chalco", municipio: "Chalco", estado: "Estado de México", cp: "56600", lat: 19.2640, lng: -98.8970 },
  { id: "tecamac", municipio: "Tecámac", estado: "Estado de México", cp: "55740", lat: 19.7130, lng: -98.9680 },
  { id: "puebla", municipio: "Puebla", estado: "Puebla", cp: "72000", lat: 19.0414, lng: -98.2063 },
  { id: "cholula", municipio: "San Pedro Cholula", estado: "Puebla", cp: "72760", lat: 19.0640, lng: -98.3030 },
  { id: "atlixco", municipio: "Atlixco", estado: "Puebla", cp: "74200", lat: 18.9080, lng: -98.4360 },
  { id: "tehuacan", municipio: "Tehuacán", estado: "Puebla", cp: "75700", lat: 18.4610, lng: -97.3930 },
  { id: "tlaxcala", municipio: "Tlaxcala", estado: "Tlaxcala", cp: "90000", lat: 19.3139, lng: -98.2404 },
  { id: "apizaco", municipio: "Apizaco", estado: "Tlaxcala", cp: "90300", lat: 19.4170, lng: -98.1400 },
  { id: "huamantla", municipio: "Huamantla", estado: "Tlaxcala", cp: "90500", lat: 19.3130, lng: -97.9230 },
  { id: "pachuca", municipio: "Pachuca", estado: "Hidalgo", cp: "42000", lat: 20.1011, lng: -98.7591 },
  { id: "tula", municipio: "Tula de Allende", estado: "Hidalgo", cp: "42800", lat: 20.0540, lng: -99.3410 },
  { id: "cuernavaca", municipio: "Cuernavaca", estado: "Morelos", cp: "62000", lat: 18.9242, lng: -99.2216 },
  { id: "cuautla", municipio: "Cuautla", estado: "Morelos", cp: "62740", lat: 18.8120, lng: -98.9550 },
  { id: "queretaro", municipio: "Querétaro", estado: "Querétaro", cp: "76000", lat: 20.5888, lng: -100.3899 },
  { id: "san-juan-del-rio", municipio: "San Juan del Río", estado: "Querétaro", cp: "76800", lat: 20.3890, lng: -99.9960 },
  { id: "corregidora", municipio: "Corregidora", estado: "Querétaro", cp: "76900", lat: 20.5440, lng: -100.4430 },
  { id: "leon", municipio: "León", estado: "Guanajuato", cp: "37000", lat: 21.1250, lng: -101.6860 },
  { id: "celaya", municipio: "Celaya", estado: "Guanajuato", cp: "38000", lat: 20.5230, lng: -100.8150 },
  { id: "irapuato", municipio: "Irapuato", estado: "Guanajuato", cp: "36500", lat: 20.6760, lng: -101.3560 },
  { id: "silao", municipio: "Silao", estado: "Guanajuato", cp: "36100", lat: 20.9430, lng: -101.4270 },
  { id: "guadalajara", municipio: "Guadalajara", estado: "Jalisco", cp: "44100", lat: 20.6597, lng: -103.3496 },
  { id: "zapopan", municipio: "Zapopan", estado: "Jalisco", cp: "45100", lat: 20.7230, lng: -103.3840 },
  { id: "tlaquepaque", municipio: "San Pedro Tlaquepaque", estado: "Jalisco", cp: "45500", lat: 20.6400, lng: -103.3110 },
  { id: "tlajomulco", municipio: "Tlajomulco de Zúñiga", estado: "Jalisco", cp: "45640", lat: 20.4730, lng: -103.4450 },
  { id: "vallarta", municipio: "Puerto Vallarta", estado: "Jalisco", cp: "48300", lat: 20.6534, lng: -105.2253 },
  { id: "monterrey", municipio: "Monterrey", estado: "Nuevo León", cp: "64000", lat: 25.6866, lng: -100.3161 },
  { id: "san-nicolas", municipio: "San Nicolás de los Garza", estado: "Nuevo León", cp: "66400", lat: 25.7440, lng: -100.3020 },
  { id: "apodaca", municipio: "Apodaca", estado: "Nuevo León", cp: "66600", lat: 25.7810, lng: -100.1880 },
  { id: "guadalupe-nl", municipio: "Guadalupe", estado: "Nuevo León", cp: "67100", lat: 25.6770, lng: -100.2560 },
  { id: "santa-catarina", municipio: "Santa Catarina", estado: "Nuevo León", cp: "66100", lat: 25.6730, lng: -100.4580 },
  { id: "saltillo", municipio: "Saltillo", estado: "Coahuila", cp: "25000", lat: 25.4232, lng: -100.9924 },
  { id: "ramos-arizpe", municipio: "Ramos Arizpe", estado: "Coahuila", cp: "25900", lat: 25.5390, lng: -100.9480 },
  { id: "torreon", municipio: "Torreón", estado: "Coahuila", cp: "27000", lat: 25.5428, lng: -103.4068 },
  { id: "aguascalientes", municipio: "Aguascalientes", estado: "Aguascalientes", cp: "20000", lat: 21.8853, lng: -102.2916 },
  { id: "slp", municipio: "San Luis Potosí", estado: "San Luis Potosí", cp: "78000", lat: 22.1565, lng: -100.9855 },
  { id: "zacatecas", municipio: "Zacatecas", estado: "Zacatecas", cp: "98000", lat: 22.7709, lng: -102.5832 },
  { id: "durango", municipio: "Durango", estado: "Durango", cp: "34000", lat: 24.0277, lng: -104.6532 },
  { id: "chihuahua", municipio: "Chihuahua", estado: "Chihuahua", cp: "31000", lat: 28.6320, lng: -106.0691 },
  { id: "juarez", municipio: "Ciudad Juárez", estado: "Chihuahua", cp: "32000", lat: 31.6904, lng: -106.4245 },
  { id: "hermosillo", municipio: "Hermosillo", estado: "Sonora", cp: "83000", lat: 29.0729, lng: -110.9559 },
  { id: "obregon", municipio: "Cajeme", estado: "Sonora", cp: "85000", lat: 27.4828, lng: -109.9304 },
  { id: "culiacan", municipio: "Culiacán", estado: "Sinaloa", cp: "80000", lat: 24.8091, lng: -107.3940 },
  { id: "mazatlan", municipio: "Mazatlán", estado: "Sinaloa", cp: "82000", lat: 23.2494, lng: -106.4111 },
  { id: "tijuana", municipio: "Tijuana", estado: "Baja California", cp: "22000", lat: 32.5149, lng: -117.0382 },
  { id: "mexicali", municipio: "Mexicali", estado: "Baja California", cp: "21000", lat: 32.6245, lng: -115.4523 },
  { id: "ensenada", municipio: "Ensenada", estado: "Baja California", cp: "22800", lat: 31.8667, lng: -116.5964 },
  { id: "la-paz", municipio: "La Paz", estado: "Baja California Sur", cp: "23000", lat: 24.1426, lng: -110.3128 },
  { id: "reynosa", municipio: "Reynosa", estado: "Tamaulipas", cp: "88500", lat: 26.0508, lng: -98.2979 },
  { id: "tampico", municipio: "Tampico", estado: "Tamaulipas", cp: "89000", lat: 22.2331, lng: -97.8611 },
  { id: "veracruz", municipio: "Veracruz", estado: "Veracruz", cp: "91700", lat: 19.1738, lng: -96.1342 },
  { id: "xalapa", municipio: "Xalapa", estado: "Veracruz", cp: "91000", lat: 19.5438, lng: -96.9102 },
  { id: "coatzacoalcos", municipio: "Coatzacoalcos", estado: "Veracruz", cp: "96400", lat: 18.1345, lng: -94.4590 },
  { id: "morelia", municipio: "Morelia", estado: "Michoacán", cp: "58000", lat: 19.7060, lng: -101.1950 },
  { id: "uruapan", municipio: "Uruapan", estado: "Michoacán", cp: "60000", lat: 19.4130, lng: -102.0560 },
  { id: "oaxaca", municipio: "Oaxaca de Juárez", estado: "Oaxaca", cp: "68000", lat: 17.0732, lng: -96.7266 },
  { id: "acapulco", municipio: "Acapulco", estado: "Guerrero", cp: "39300", lat: 16.8531, lng: -99.8237 },
  { id: "chilpancingo", municipio: "Chilpancingo", estado: "Guerrero", cp: "39000", lat: 17.5510, lng: -99.5050 },
  { id: "tuxtla", municipio: "Tuxtla Gutiérrez", estado: "Chiapas", cp: "29000", lat: 16.7516, lng: -93.1029 },
  { id: "villahermosa", municipio: "Villahermosa", estado: "Tabasco", cp: "86000", lat: 17.9892, lng: -92.9475 },
  { id: "merida", municipio: "Mérida", estado: "Yucatán", cp: "97000", lat: 20.9674, lng: -89.5926 },
  { id: "cancun", municipio: "Cancún", estado: "Quintana Roo", cp: "77500", lat: 21.1619, lng: -86.8515 },
  { id: "playa", municipio: "Playa del Carmen", estado: "Quintana Roo", cp: "77710", lat: 20.6296, lng: -87.0739 },
  { id: "campeche", municipio: "Campeche", estado: "Campeche", cp: "24000", lat: 19.8301, lng: -90.5349 },
  { id: "tepic", municipio: "Tepic", estado: "Nayarit", cp: "63000", lat: 21.5042, lng: -104.8946 },
  { id: "colima", municipio: "Colima", estado: "Colima", cp: "28000", lat: 19.2433, lng: -103.7250 },
];

const POR_ID = new Map(UBICACIONES.map((u) => [u.id, u]));
export const ubicacion = (id: string) => POR_ID.get(id) ?? UBICACIONES[0];

export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Busca el código postal: exacto, o el más cercano con el mismo prefijo.
export function buscarCP(cp: string): Ubicacion | null {
  const limpio = cp.replace(/\D/g, "");
  if (limpio.length !== 5) return null;
  const exacto = UBICACIONES.find((u) => u.cp === limpio);
  if (exacto) return exacto;
  for (const largo of [3, 2]) {
    const pref = limpio.slice(0, largo);
    const candidatos = UBICACIONES.filter((u) => u.cp.startsWith(pref));
    if (candidatos.length) {
      const n = Number(limpio);
      return candidatos.sort((a, b) => Math.abs(Number(a.cp) - n) - Math.abs(Number(b.cp) - n))[0];
    }
  }
  return null;
}

export const RADIOS: { km: number | null; etiqueta: string }[] = [
  { km: 10, etiqueta: "10 km" },
  { km: 25, etiqueta: "25 km" },
  { km: 50, etiqueta: "50 km" },
  { km: 100, etiqueta: "100 km" },
  { km: 250, etiqueta: "250 km" },
  { km: null, etiqueta: "Todo México" },
];

export const etiquetaLugar = (u: Ubicacion) => `${u.municipio}, ${abreviaEstado(u.estado)}`;

export function abreviaEstado(e: string) {
  const m: Record<string, string> = {
    "Ciudad de México": "CDMX",
    "Estado de México": "Edo. Méx.",
    "Baja California Sur": "BCS",
    "Baja California": "BC",
    "San Luis Potosí": "SLP",
    "Nuevo León": "NL",
    "Quintana Roo": "Q. Roo",
  };
  return m[e] ?? e;
}

export function textoDistancia(km: number) {
  if (km < 1) return "a menos de 1 km";
  if (km < 10) return `a ${km.toFixed(1).replace(".0", "")} km`;
  return `a ${Math.round(km).toLocaleString("es-MX")} km`;
}
