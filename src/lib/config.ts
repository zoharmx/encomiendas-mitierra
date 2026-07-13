/**
 * Branding y textos del negocio.
 *
 * ÚNICO lugar donde vive la identidad de la marca. Los componentes leen de aquí:
 * nunca escribas el nombre, el teléfono o un color de marca dentro de un componente.
 *
 * Para convertir este proyecto en "Tracking Lite" para otro cliente basta con
 * editar este archivo (y el catálogo de estatus en src/types/index.ts).
 */

export const NEGOCIO = {
  nombre: 'Encomiendas Mi Tierra',
  nombreCorto: 'Mi Tierra',
  tagline: 'Rastrea tu envío',
  descripcion: 'Paquetería y encomiendas puerta a puerta.',
  sitio: 'https://encomiendasmitierra.com',

  /** Teléfono principal en formato E.164, sin espacios (para enlaces wa.me y tel:). */
  whatsapp: '18317858487',
  /** Teléfono secundario / oficina. */
  telefonoAlterno: '18328660050',
  /** Cómo se muestran al usuario. */
  whatsappVisible: '+1 (831) 785-8487',
  telefonoAlternoVisible: '+1 (832) 866-0050',

  email: 'hoymismofletes@gmail.com',
} as const;

/** Prefijo de los folios. Debe coincidir con el que genera src/lib/envios.ts. */
export const PREFIJO_FOLIO = 'EMT';

/** Formato del folio: EMT-0000-XXXX (4 dígitos consecutivos + 4 caracteres aleatorios). */
export const REGEX_FOLIO = /^EMT-\d{4}-[A-Z0-9]{4}$/;

/**
 * Mensajes de WhatsApp pre-armados. Se codifican al construir la URL.
 */
export const MENSAJES = {
  /** Lo que el cliente envía al negocio cuando su folio no aparece. */
  folioNoEncontrado: (folio: string) =>
    `Hola, consulté el folio ${folio} en el rastreo y no aparece. ¿Me pueden ayudar?`,

  /** Lo que el cliente comparte con quien quiera (o el staff manda al cliente). */
  compartirTracking: (folio: string, url: string) =>
    `Rastrea tu envío con ${NEGOCIO.nombre}.\nFolio: ${folio}\n${url}`,
} as const;

/** Construye un enlace de WhatsApp con mensaje pre-armado. */
export function urlWhatsApp(mensaje: string, telefono: string = NEGOCIO.whatsapp): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
}

/** URL pública absoluta de rastreo de un folio (para QR y para compartir). */
export function urlTracking(folio: string, origen?: string): string {
  const base =
    origen ??
    (typeof window !== 'undefined' ? window.location.origin : NEGOCIO.sitio);
  return `${base}/tracking?folio=${encodeURIComponent(folio)}`;
}

/**
 * Estados sugeridos en el formulario (autocompletado, no una restricción).
 * La operación es en Estados Unidos: códigos USPS de 2 letras.
 */
export const ESTADOS_EEUU = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

/**
 * Países de destino que cubre la ruta de la empresa (EE. UU. → México y
 * Centroamérica), con su código de llamada. Necesario porque EE. UU. y
 * México comparten longitud de 10 dígitos: no se puede adivinar el país
 * a partir del teléfono, hay que preguntarlo.
 */
export const PAISES_DESTINO = [
  { nombre: 'Estados Unidos', codigo: '1' },
  { nombre: 'México', codigo: '52' },
  { nombre: 'Guatemala', codigo: '502' },
  { nombre: 'Belice', codigo: '501' },
  { nombre: 'El Salvador', codigo: '503' },
  { nombre: 'Honduras', codigo: '504' },
  { nombre: 'Nicaragua', codigo: '505' },
  { nombre: 'Costa Rica', codigo: '506' },
  { nombre: 'Panamá', codigo: '507' },
] as const;

/** Código de llamada del país, para anteponerlo al armar un enlace de WhatsApp. */
export function codigoLlamada(pais: string): string {
  return PAISES_DESTINO.find((p) => p.nombre === pais)?.codigo ?? '1';
}

/** Teléfono en formato internacional (sin "+"), listo para un enlace wa.me. */
export function telefonoInternacional(telefono: string, pais: string): string {
  return `${codigoLlamada(pais)}${telefono}`;
}
