'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { LogIn } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { NEGOCIO } from '@/lib/config';
import { Boton } from '@/components/ui/Boton';
import { Input } from '@/components/ui/Campo';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Logo } from '@/components/ui/Logo';

/** El logo de Google es multicolor por marca registrada: no lo cubre un ícono de lucide. */
function LogoGoogle() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.64v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

/** Traduce los códigos de Firebase Auth a algo que un humano entienda. */
function mensajeDeError(codigo: string): string {
  switch (codigo) {
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta está desactivada. Contacta al administrador.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos minutos y vuelve a intentarlo.';
    case 'auth/network-request-failed':
      return 'No hay conexión. Revisa tu internet e intenta de nuevo.';
    // Firebase devuelve el mismo código para usuario inexistente y contraseña
    // incorrecta, a propósito: distinguirlos revelaría qué correos están dados
    // de alta. El mensaje también los trata igual.
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    default:
      return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
}

function FormularioLogin() {
  const router = useRouter();
  const parametros = useSearchParams();
  // Solo rutas internas: un `destino` con URL absoluta sería un open redirect.
  const destinoCrudo = parametros.get('destino') ?? '/admin';
  const destino = destinoCrudo.startsWith('/admin') ? destinoCrudo : '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);

  /** Común a ambos métodos: crea la cookie HttpOnly y redirige. */
  async function completarSesion(credencial: UserCredential) {
    const idToken = await credencial.user.getIdToken();

    // La cookie HttpOnly es lo que deja pasar al middleware. Sin este paso,
    // el usuario quedaría autenticado en el navegador pero rebotaría en /admin.
    const respuesta = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!respuesta.ok) {
      throw new Error('sesion');
    }

    router.push(destino);
    router.refresh();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const credencial = await signInWithEmailAndPassword(auth, email.trim(), password);
      await completarSesion(credencial);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(mensajeDeError(err.code));
      } else {
        setError('No se pudo crear la sesión. Intenta de nuevo.');
      }
      setCargando(false);
    }
  }

  async function entrarConGoogle() {
    setError(null);
    setCargandoGoogle(true);

    try {
      const credencial = await signInWithPopup(auth, new GoogleAuthProvider());
      await completarSesion(credencial);
    } catch (err) {
      // Si el usuario cierra la ventana de Google, no es un error que valga la
      // pena mostrarle: simplemente no completó el inicio de sesión.
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        setCargandoGoogle(false);
        return;
      }
      setError('No se pudo entrar con Google. Intenta de nuevo.');
      setCargandoGoogle(false);
    }
  }

  return (
    <Tarjeta className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/95 p-2 shadow-lg shadow-black/20">
          <Logo variante="emblema" alto={44} />
        </div>
        <h1 className="text-xl font-bold text-white">Acceso del personal</h1>
        <p className="mt-1 text-sm text-slate-400">{NEGOCIO.nombre}</p>
      </div>

      <Boton
        type="button"
        variante="secundario"
        tamano="lg"
        anchoCompleto
        cargando={cargandoGoogle}
        disabled={cargando}
        onClick={entrarConGoogle}
      >
        {!cargandoGoogle && <LogoGoogle />}
        Entrar con Google
      </Boton>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        o con tu correo
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Input
          id="email"
          type="email"
          etiqueta="Correo"
          autoComplete="username"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          etiqueta="Contraseña"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          >
            {error}
          </p>
        )}

        <Boton type="submit" tamano="lg" anchoCompleto cargando={cargando} disabled={cargandoGoogle}>
          {!cargando && <LogIn className="size-4" aria-hidden="true" />}
          Entrar
        </Boton>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        ¿Solo quieres rastrear un envío?{' '}
        <Link href="/tracking" className="text-blue-400 hover:underline">
          Consulta tu folio aquí
        </Link>
      </p>
    </Tarjeta>
  );
}

export default function PaginaLogin() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      {/* useSearchParams exige Suspense en el App Router. */}
      <Suspense fallback={<Tarjeta className="h-96 w-full max-w-sm animate-pulse" />}>
        <FormularioLogin />
      </Suspense>
    </main>
  );
}
