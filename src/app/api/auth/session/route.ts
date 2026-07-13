/**
 * Sesión del staff (cookie HttpOnly).
 *
 *   POST   → recibe el idToken de Firebase Auth, lo verifica con el Admin SDK
 *            y devuelve una cookie de sesión HttpOnly de 5 días.
 *   DELETE → cierra sesión (borra la cookie).
 *
 * Este es el ÚNICO lugar del proyecto donde se usa firebase-admin.
 */
import { NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';
import { COOKIE_SESION, DURACION_SESION_MS } from '@/lib/sesion';

// El Admin SDK necesita el runtime de Node (no funciona en Edge).
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let idToken: unknown;

  try {
    ({ idToken } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Petición inválida.' }, { status: 400 });
  }

  if (typeof idToken !== 'string' || idToken.length === 0) {
    return NextResponse.json({ error: 'Falta el token de acceso.' }, { status: 400 });
  }

  try {
    const admin = authAdmin();

    // checkRevoked: si al usuario se le revocó la sesión, no se le da una nueva.
    await admin.verifyIdToken(idToken, true);

    const cookie = await admin.createSessionCookie(idToken, {
      expiresIn: DURACION_SESION_MS,
    });

    const respuesta = NextResponse.json({ ok: true });
    respuesta.cookies.set({
      name: COOKIE_SESION,
      value: cookie,
      maxAge: DURACION_SESION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return respuesta;
  } catch {
    // Sin detalles al cliente y sin loggear el token: un token inválido es un
    // token inválido, y el mensaje del SDK puede filtrar datos de la cuenta.
    return NextResponse.json(
      { error: 'No se pudo iniciar la sesión. Vuelve a intentarlo.' },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set({
    name: COOKIE_SESION,
    value: '',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return respuesta;
}
