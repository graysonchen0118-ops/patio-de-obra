import type { TipoVendedor, EstadoBienvenida } from "../types";

// registro: días antes de hoy
export interface UsuarioSemilla {
  id: string;
  nombre: string;
  negocio: string;
  tipo: TipoVendedor;
  foto: string;
  ubicacionId: string;
  telefono: string;
  email: string;
  registro: number;
  bienvenida: EstadoBienvenida;
}

export const USUARIOS: UsuarioSemilla[] = [
  { id: "u1", nombre: "Laura Benítez", negocio: "Constructora Benítez Arcos", tipo: "Constructora", foto: "ppl16", ubicacionId: "naucalpan", telefono: "5521874630", email: "laura@benitezarcos.mx", registro: 205, bienvenida: "otorgada" },
  { id: "u2", nombre: "Rogelio Huerta", negocio: "Ferretería y Materiales La Huerta", tipo: "Ferretería", foto: "ppl11", ubicacionId: "azcapotzalco", telefono: "5539021187", email: "ventas@lahuerta.mx", registro: 160, bienvenida: "otorgada" },
  { id: "u3", nombre: "Jesús Cárdenas", negocio: "Jesús Cárdenas, maestro de obra", tipo: "Maestro de obra", foto: "ppl13", ubicacionId: "ecatepec", telefono: "5531209876", email: "chuy.cardenas@correo.mx", registro: 74, bienvenida: "otorgada" },
  { id: "u4", nombre: "Marisol Ortega", negocio: "Acabados Talavera del Centro", tipo: "Ferretería", foto: "ppl15", ubicacionId: "puebla", telefono: "2221456093", email: "marisol@talaveradelcentro.mx", registro: 132, bienvenida: "otorgada" },
  { id: "u5", nombre: "Héctor Salinas", negocio: "Rentas y Maquinaria del Bajío", tipo: "Renta de maquinaria", foto: "ppl8", ubicacionId: "leon", telefono: "4772093318", email: "hector@maquinariabajio.mx", registro: 188, bienvenida: "otorgada" },
  { id: "u6", nombre: "Daniel Garza", negocio: "Constructora Cumbres del Norte", tipo: "Constructora", foto: "ppl10", ubicacionId: "monterrey", telefono: "8180457721", email: "dgarza@cumbresnorte.mx", registro: 97, bienvenida: "otorgada" },
  { id: "u7", nombre: "Arturo Pineda", negocio: "Materiales El Tezontle", tipo: "Ferretería", foto: "ppl20", ubicacionId: "apizaco", telefono: "2411178840", email: "eltezontle@correo.mx", registro: 58, bienvenida: "otorgada" },
  { id: "u8", nombre: "Karla Ríos", negocio: "Edificaciones Occidente", tipo: "Constructora", foto: "ppl17", ubicacionId: "zapopan", telefono: "3319907452", email: "krios@edificacionesoccidente.mx", registro: 121, bienvenida: "otorgada" },
  { id: "u9", nombre: "Luis Mendoza", negocio: "Plomería y Materiales Queretana", tipo: "Ferretería", foto: "ppl19", ubicacionId: "queretaro", telefono: "4422671093", email: "luis@plomeriaqueretana.mx", registro: 66, bienvenida: "otorgada" },
  { id: "u10", nombre: "Sergio Vargas", negocio: "Sergio Vargas", tipo: "Particular", foto: "ppl9", ubicacionId: "coyoacan", telefono: "5587120934", email: "sergio.vargas@correo.mx", registro: 39, bienvenida: "otorgada" },
  { id: "u11", nombre: "Ramiro Juárez", negocio: "Ramiro Juárez, maestro de obra", tipo: "Maestro de obra", foto: "ppl1", ubicacionId: "toluca", telefono: "7223308164", email: "ramiro.juarez@correo.mx", registro: 47, bienvenida: "otorgada" },
  { id: "u12", nombre: "Ana Chi", negocio: "Desarrollos Peninsulares", tipo: "Constructora", foto: "ppl18", ubicacionId: "merida", telefono: "9991284476", email: "ana.chi@desarrollospeninsulares.mx", registro: 83, bienvenida: "otorgada" },
  { id: "u13", nombre: "Fernando Treviño", negocio: "Constructora Sierra Madre", tipo: "Constructora", foto: "ppl7", ubicacionId: "saltillo", telefono: "8445509127", email: "ftrevino@sierramadre.mx", registro: 112, bienvenida: "otorgada" },
  { id: "u14", nombre: "Alberto Ramos", negocio: "Herramientas Don Beto", tipo: "Ferretería", foto: "ppl12", ubicacionId: "guadalajara", telefono: "3336620981", email: "donbeto@herramientas.mx", registro: 145, bienvenida: "otorgada" },
  { id: "u15", nombre: "Rubén Ibarra", negocio: "Obra Civil del Pacífico", tipo: "Constructora", foto: "ppl6", ubicacionId: "culiacan", telefono: "6672214598", email: "ribarra@obracivilpacifico.mx", registro: 92, bienvenida: "otorgada" },
  { id: "u16", nombre: "Ernesto Lara", negocio: "Materiales Hermanos Lara", tipo: "Ferretería", foto: "ppl2", ubicacionId: "veracruz", telefono: "2299413076", email: "hermanoslara@correo.mx", registro: 101, bienvenida: "otorgada" },
  { id: "u17", nombre: "Jorge Medina", negocio: "Instalaciones Medina", tipo: "Maestro de obra", foto: "ppl3", ubicacionId: "tijuana", telefono: "6641873320", email: "jorge@instalacionesmedina.mx", registro: 70, bienvenida: "otorgada" },
  { id: "u18", nombre: "Efraín Castillo", negocio: "Efraín Castillo, maestro de obra", tipo: "Maestro de obra", foto: "ppl4", ubicacionId: "iztapalapa", telefono: "5560981243", email: "efrain.castillo@correo.mx", registro: 28, bienvenida: "otorgada" },
  { id: "u19", nombre: "Óscar Navarro", negocio: "Constructora Lomas Verdes", tipo: "Constructora", foto: "ppl5", ubicacionId: "tlalnepantla", telefono: "5544207719", email: "onavarro@lomasverdes.mx", registro: 154, bienvenida: "otorgada" },
  // misma persona, mismo WhatsApp, cuentas nuevas: la cuenta se crea, el regalo no se repite
  { id: "u21", nombre: "Jesús Cárdenas", negocio: "Materiales Cárdenas", tipo: "Maestro de obra", foto: "ppl13", ubicacionId: "ecatepec", telefono: "5531209876", email: "materialescardenas@correo.mx", registro: 9, bienvenida: "bloqueada" },
  { id: "u22", nombre: "J. Cárdenas", negocio: "Sobrantes Ecatepec", tipo: "Particular", foto: "ppl13", ubicacionId: "ecatepec", telefono: "5531209876", email: "sobrantes.ecatepec@correo.mx", registro: 3, bienvenida: "bloqueada" },
  // usaron su regalo y no han vuelto a comprar: el número que más importa del tablero
  { id: "u24", nombre: "Pedro Salazar", negocio: "Pedro Salazar, maestro de obra", tipo: "Maestro de obra", foto: "", ubicacionId: "gam", telefono: "5590127734", email: "pedro.salazar@correo.mx", registro: 64, bienvenida: "otorgada" },
  { id: "u25", nombre: "Mónica Rangel", negocio: "Remodelaciones Rangel", tipo: "Constructora", foto: "", ubicacionId: "queretaro", telefono: "4421907765", email: "monica@remodelacionesrangel.mx", registro: 48, bienvenida: "otorgada" },
  { id: "u26", nombre: "Hugo Esparza", negocio: "Ferretería Esparza", tipo: "Ferretería", foto: "", ubicacionId: "guadalajara", telefono: "3312095518", email: "ferreteriaesparza@correo.mx", registro: 91, bienvenida: "otorgada" },
  { id: "u27", nombre: "Raúl Domínguez", negocio: "Raúl Domínguez", tipo: "Particular", foto: "", ubicacionId: "puebla", telefono: "2229014472", email: "raul.dominguez@correo.mx", registro: 37, bienvenida: "otorgada" },
  { id: "u28", nombre: "Teresa Ávila", negocio: "Construcciones Ávila", tipo: "Constructora", foto: "", ubicacionId: "merida", telefono: "9993308121", email: "tavila@construccionesavila.mx", registro: 120, bienvenida: "otorgada" },
  { id: "u29", nombre: "Iván Chávez", negocio: "Iván Chávez, maestro de obra", tipo: "Maestro de obra", foto: "", ubicacionId: "tlaxcala", telefono: "2461187703", email: "ivan.chavez@correo.mx", registro: 55, bienvenida: "otorgada" },
  { id: "u30", nombre: "Gabriela Soto", negocio: "Acabados Soto", tipo: "Ferretería", foto: "", ubicacionId: "monterrey", telefono: "8119021146", email: "gabriela@acabadossoto.mx", registro: 77, bienvenida: "otorgada" },
  { id: "u23", nombre: "Gerardo Ochoa", negocio: "Ferretería Ochoa", tipo: "Ferretería", foto: "hw3", ubicacionId: "cuernavaca", telefono: "7773029915", email: "ferreteriaochoa@correo.mx", registro: 12, bienvenida: "otorgada" },
];
