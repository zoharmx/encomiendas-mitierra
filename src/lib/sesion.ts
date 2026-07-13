/**
 * Constantes de la sesión del staff.
 *
 * Módulo sin dependencias a propósito: lo importan tanto el middleware (runtime
 * Edge) como la API route (runtime Node). Si estas constantes vivieran en
 * firebase-admin.ts, el middleware arrastraría el Admin SDK al Edge y reventaría.
 */

/**
 * Nombre de la cookie de sesión.
 *
 * Debe llamarse `__session`: Firebase Hosting descarta cualquier otra cookie
 * antes de que llegue al backend. Mantener el nombre evita una sorpresa cara
 * si algún día se migra el hosting.
 */
export const COOKIE_SESION = '__session';

/** Duración de la sesión: 5 días (Firebase permite hasta 14). */
export const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000;
