// Mezclas de color para derivar toda la paleta desde el color de la marca.
const hex = (h: string) => {
  const x = h.replace("#", "");
  const n = x.length === 3 ? x.split("").map((c) => c + c).join("") : x;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};
const aHex = (rgb: number[]) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const mezclar = (a: string, b: string, t: number) => {
  const x = hex(a);
  const y = hex(b);
  return aHex(x.map((v, i) => v + (y[i] - v) * t));
};
export const valido = (h: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h);

export function paleta(color: string) {
  const c = valido(color) ? color : "#b5452b";
  return {
    "--accent": c,
    "--accent-2": mezclar(c, "#f2b37a", 0.32),
    "--accent-ink": mezclar(c, "#000000", 0.25),
    "--accent-soft": mezclar(c, "#ffffff", 0.86),
    "--grad": `linear-gradient(135deg, ${c} 0%, ${mezclar(c, "#f2b37a", 0.32)} 100%)`,
  };
}

// Colores listos para que la constructora elija sin pensar en códigos.
export const PRESETS = [
  { nombre: "Tezontle", color: "#b5452b" },
  { nombre: "Azul obra", color: "#1f5fa8" },
  { nombre: "Verde cantera", color: "#2f7a4f" },
  { nombre: "Ocre", color: "#a8670f" },
  { nombre: "Grafito", color: "#3b4650" },
  { nombre: "Vino", color: "#8a2340" },
];
