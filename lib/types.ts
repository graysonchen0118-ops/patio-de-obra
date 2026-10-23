export type ISODate = string; // YYYY-MM-DD, día calendario en hora del centro de México

export interface Ubicacion {
  id: string;
  municipio: string;
  estado: string;
  cp: string;
  lat: number;
  lng: number;
}

export type TipoCampo = "lista" | "texto" | "numero";

export interface CampoPersonalizado {
  id: string;
  etiqueta: string;
  tipo: TipoCampo;
  opciones?: string[];
  requerido: boolean;
  sufijo?: string;
}

export interface Subcategoria {
  id: string;
  nombre: string;
  unidades: string[];
  campos: CampoPersonalizado[];
  fotos: string[];
}

export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  foto: string;
  sub: Subcategoria[];
}

export type Condicion = "Nuevo" | "Seminuevo" | "Usado";
export type EstadoAnuncio = "activo" | "agotado" | "pausado" | "vencido" | "suspendido";

export interface Anuncio {
  id: string;
  titulo: string;
  catId: string;
  subId: string;
  campos: Record<string, string>;
  condicion: Condicion;
  precio: number;
  unidad: string;
  cantidad: number;
  cantidadInicial: number;
  minimo?: number;
  vendedorId: string;
  ubicacionId: string;
  fotos: string[];
  descripcion: string;
  publicadoEl: ISODate;
  venceEl: ISODate;
  estado: EstadoAnuncio;
  vistas: number;
  contactos: number;
  factura: boolean;
  flete: boolean;
  renovaciones: number;
}

export type TipoVendedor = "Constructora" | "Ferretería" | "Maestro de obra" | "Particular" | "Renta de maquinaria";
export type EstadoBienvenida = "otorgada" | "bloqueada" | "pendiente";

export interface Usuario {
  id: string;
  nombre: string;
  negocio: string;
  tipo: TipoVendedor;
  foto: string;
  ubicacionId: string;
  telefono: string; // solo dígitos, nunca se muestra completo
  email: string;
  registradoEl: ISODate;
  whatsappVerificado: boolean;
  bienvenida: EstadoBienvenida;
  rol: "vendedor" | "admin";
}

export type OrigenLote = "bienvenida" | "compra" | "ajuste";

export interface LoteCreditos {
  id: string;
  usuarioId: string;
  origen: OrigenLote;
  nombre: string;
  cantidad: number;
  restantes: number;
  vencidos: number;
  creadoEl: ISODate;
  venceEl: ISODate; // último día válido, hasta las 23:59 hora del centro
  pagoId?: string;
}

export type TipoMovimiento = "bienvenida" | "compra" | "publicacion" | "renovacion" | "vencimiento" | "ajuste";

export interface Movimiento {
  id: string;
  usuarioId: string;
  loteId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: ISODate;
  anuncioId?: string;
  nota: string;
}

export type MetodoPago = "tarjeta" | "oxxo" | "spei";

export interface Pago {
  id: string;
  usuarioId: string;
  paqueteId: string;
  creditos: number;
  monto: number;
  metodo: MetodoPago;
  fecha: ISODate;
  estado: "pagado" | "pendiente";
  referencia?: string;
}

export interface Paquete {
  id: string;
  nombre: string;
  creditos: number;
  precio: number;
  destacado?: boolean;
}

export interface Reglas {
  bienvenidaCreditos: number;
  bienvenidaDias: number;
  compraMeses: number;
  anuncioDias: number;
  renovacionCreditos: number;
  avisoCreditoDias: number;
  avisoAnuncioDias: number;
  minResultados: number;
}

export type TipoAviso = "credito" | "anuncio" | "contacto" | "cuenta";

export interface Aviso {
  id: string;
  usuarioId: string;
  fecha: ISODate;
  tipo: TipoAviso;
  texto: string;
  leido: boolean;
  href?: string;
}

export interface EventoCalendario {
  id: string;
  fecha: ISODate;
  texto: string;
  tipo: "vence-credito" | "vence-anuncio" | "aviso";
}

export interface Db {
  version: number;
  hoy: ISODate;
  hoyReal: ISODate;
  usuarioId: string;
  usuarios: Usuario[];
  categorias: Categoria[];
  anuncios: Anuncio[];
  lotes: LoteCreditos[];
  movimientos: Movimiento[];
  pagos: Pago[];
  paquetes: Paquete[];
  reglas: Reglas;
  avisos: Aviso[];
  eventos: EventoCalendario[];
  seq: number;
  busquedaUbicacionId: string;
}
