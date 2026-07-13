'use client';

/**
 * Sesión del staff en el navegador.
 *
 * Firebase Auth dice QUIÉN es el usuario; el documento usuarios/{uid} dice si
 * es staff activo y con qué rol. Ambas cosas hacen falta: un usuario de Auth
 * sin perfil en Firestore no puede leer ni escribir nada (lo impiden las reglas),
 * así que aquí se le trata como no autorizado y se le expulsa.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Usuario } from '@/types';

export interface Sesion {
  /** Usuario de Firebase Auth, o null si no hay sesión. */
  user: User | null;
  /** Perfil de staff (usuarios/{uid}), o null si no existe / no está activo. */
  perfil: Usuario | null;
  /** true mientras se resuelve el estado inicial. */
  cargando: boolean;
  /** Datos que envios.ts necesita para firmar cada movimiento del historial. */
  usuarioActual: { uid: string; nombre: string } | null;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<Sesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setPerfil(null);
        setCargando(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'usuarios', u.uid));
        const datos = snap.exists() ? (snap.data() as Usuario) : null;
        // Un perfil inactivo equivale a no tener perfil.
        setPerfil(datos?.activo ? datos : null);
        setUser(u);
      } catch {
        // Sin perfil legible no hay panel posible: se trata como no autorizado.
        setPerfil(null);
        setUser(u);
      } finally {
        setCargando(false);
      }
    });
  }, []);

  async function cerrarSesion() {
    await signOut(auth);
    // Borra también la cookie HttpOnly; si no, el middleware seguiría dejando pasar.
    await fetch('/api/auth/session', { method: 'DELETE' });
    window.location.href = '/login';
  }

  const usuarioActual =
    user && perfil ? { uid: user.uid, nombre: perfil.nombre } : null;

  return (
    <Contexto.Provider value={{ user, perfil, cargando, usuarioActual, cerrarSesion }}>
      {children}
    </Contexto.Provider>
  );
}

export function useSesion(): Sesion {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>.');
  return ctx;
}
