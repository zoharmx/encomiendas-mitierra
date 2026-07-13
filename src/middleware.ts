/**
 * Guardia de /admin/*.
 *
 * El middleware corre en el runtime Edge, donde firebase-admin (SDK de Node)
 * NO puede ejecutarse. Por eso aquí solo se comprueba que EXISTA la cookie de
 * sesión: es un filtro barato que evita servir el panel a un visitante suelto.
 *
 * La autorización de verdad está en dos capas que sí son infalsificables:
 *   1. firestore.rules — nadie lee ni escribe un envío sin ser staff activo.
 *   2. src/app/admin/layout.tsx — valida la sesión real contra Firebase Auth
 *      y expulsa a quien no tenga perfil de staff.
 *
 * Una cookie falsificada pasa este middleware y no obtiene absolutamente nada:
 * el panel se queda vacío porque Firestore rechaza todas sus lecturas.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESION } from '@/lib/sesion';

export function middleware(request: NextRequest) {
  const sesion = request.cookies.get(COOKIE_SESION)?.value;

  if (!sesion) {
    const login = new URL('/login', request.url);
    // Para regresarlo a donde iba después de autenticarse.
    login.searchParams.set('destino', request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
