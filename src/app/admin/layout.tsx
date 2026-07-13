'use client';

/**
 * Shell del panel + guardia de autenticación real.
 *
 * El middleware ya filtró a quien no trae cookie. Aquí se valida lo que el
 * middleware no puede validar en el Edge: que la sesión de Firebase Auth siga
 * viva y que el usuario tenga perfil de staff ACTIVO en usuarios/{uid}.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, Loader2, LogOut, PlusCircle, ShieldAlert } from 'lucide-react';
import { ProveedorSesion, useSesion } from '@/lib/auth-context';
import { NEGOCIO } from '@/lib/config';
import { Boton } from '@/components/ui/Boton';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin', etiqueta: 'Envíos', icono: LayoutDashboard },
  { href: '/admin/nuevo', etiqueta: 'Nuevo envío', icono: PlusCircle },
];

function Cargando({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center gap-3 text-slate-400">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

function Guardia({ children }: { children: React.ReactNode }) {
  const { user, perfil, cargando, cerrarSesion } = useSesion();
  const ruta = usePathname();

  useEffect(() => {
    // Cookie presente pero sin sesión de Firebase (p. ej. expiró en el navegador):
    // se manda a login en vez de mostrar un panel que no podría leer nada.
    if (!cargando && !user) {
      window.location.href = `/login?destino=${encodeURIComponent(ruta)}`;
    }
  }, [cargando, user, ruta]);

  if (cargando) return <Cargando texto="Verificando tu sesión…" />;
  if (!user) return <Cargando texto="Redirigiendo…" />;

  // Autenticado en Firebase Auth pero sin perfil de staff: no es un error de red,
  // es alguien a quien todavía no le dan de alta (o le dieron de baja).
  if (!perfil) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-4">
        <Tarjeta className="w-full max-w-md text-center">
          <ShieldAlert className="mx-auto mb-4 size-10 text-amber-400" aria-hidden="true" />
          <h1 className="mb-2 text-lg font-bold text-white">Tu cuenta no tiene acceso al panel</h1>
          <p className="mb-6 text-sm text-slate-400">
            La cuenta <span className="text-slate-200">{user.email}</span> existe, pero no está dada
            de alta como personal activo. Pídele a un administrador que te agregue.
          </p>
          <Boton variante="secundario" anchoCompleto onClick={cerrarSesion}>
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </Boton>
        </Tarjeta>
      </main>
    );
  }

  return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { perfil, cerrarSesion } = useSesion();
  const ruta = usePathname();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/95 p-1">
              <Logo variante="emblema" alto={22} />
            </span>
            <span className="hidden sm:inline">{NEGOCIO.nombreCorto}</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map(({ href, etiqueta, icono: Icono }) => {
              const activo = ruta === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={activo ? 'page' : undefined}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition',
                    activo
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                  )}
                >
                  <Icono className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{etiqueta}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 md:inline">{perfil?.nombre}</span>
            <Boton variante="fantasma" tamano="sm" onClick={cerrarSesion}>
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </Boton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <ProveedorSesion>
      <Guardia>
        <Shell>{children}</Shell>
      </Guardia>
    </ProveedorSesion>
  );
}
