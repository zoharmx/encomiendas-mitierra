import { Timestamp } from 'firebase/firestore';

// ============================================================
// Catálogo de estatus — ÚNICA fuente de verdad.
// Cambiar el flujo del negocio = editar este arreglo.
// ============================================================
export const FLUJO_ESTATUS = [
  'registrado',
  'recolectado',
  'en_bodega',
  'en_transito',
  'en_destino',
  'en_reparto',
  'entregado',
] as const;

export const ESTATUS_FUERA_DE_FLUJO = ['incidencia', 'cancelado'] as const;

export type EstatusFlujo = (typeof FLUJO_ESTATUS)[number];
export type EstatusExtra = (typeof ESTATUS_FUERA_DE_FLUJO)[number];
export type Estatus = EstatusFlujo | EstatusExtra;

export const ESTATUS_META: Record<Estatus, { etiqueta: string; icono: string }> = {
  registrado:  { etiqueta: 'Envío registrado',    icono: 'file-plus' },
  recolectado: { etiqueta: 'Recolectado',         icono: 'package-check' },
  en_bodega:   { etiqueta: 'En bodega de origen', icono: 'warehouse' },
  en_transito: { etiqueta: 'En tránsito',         icono: 'truck' },
  en_destino:  { etiqueta: 'En ciudad destino',   icono: 'map-pin' },
  en_reparto:  { etiqueta: 'En reparto',          icono: 'bike' },
  entregado:   { etiqueta: 'Entregado',           icono: 'check-circle' },
  incidencia:  { etiqueta: 'Incidencia',          icono: 'alert-triangle' },
  cancelado:   { etiqueta: 'Cancelado',           icono: 'x-circle' },
};

// ============================================================
// Documento interno — envios/{folio}
// ============================================================
export interface Persona {
  nombre: string;
  telefono: string;
  email?: string;
  ciudad: string;
  estado: string;
  direccion: string;
  /** Necesario para saber qué código de llamada anteponer al armar el enlace de WhatsApp. */
  pais: string;
}

export interface Envio {
  folio: string;
  estatus: Estatus;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
  entregadoEn: Timestamp | null;

  remitente: Persona;
  destinatario: Persona;

  paquete: {
    descripcion: string;
    piezas: number;
    pesoKg: number;
    valorDeclarado?: number | null;
    fotoUrl?: string | null;
  };

  servicio: {
    tipo: 'terrestre' | 'aereo';
    costo: number;
    moneda: 'USD';
    pagado: boolean;
    formaPago?: string | null;
  };

  notasInternas: string;   // ⚠ NUNCA copiar al espejo público
  creadoPor: string;
}

// envios/{folio}/historial/{eventoId}
export interface EventoHistorial {
  estatus: Estatus;
  fecha: Timestamp;
  nota: string;           // visible al cliente
  notaInterna?: string;   // ⚠ NUNCA copiar al espejo público
  usuarioId: string;
  usuarioNombre: string;
}

// ============================================================
// Espejo público — tracking/{folio}
// Solo estos campos. Las reglas rechazan cualquier campo extra.
// ============================================================
export interface EventoPublico {
  estatus: Estatus;
  fecha: Timestamp;
  nota: string;
}

export interface TrackingPublico {
  folio: string;
  estatus: Estatus;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
  origen: string;                  // "Monterrey, NL"
  destino: string;                 // "Guadalajara, JAL"
  destinatarioIniciales: string;   // "J.R."
  piezas: number;
  historial: EventoPublico[];
}

// usuarios/{uid}
export interface Usuario {
  email: string;
  nombre: string;
  rol: 'admin' | 'operador';
  activo: boolean;
}
