'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { cambiarEstatus } from '@/lib/envios';
import { useSesion } from '@/lib/auth-context';
import { etiqueta, transicionesValidas } from '@/lib/estatus';
import { Boton } from '@/components/ui/Boton';
import { Input, Select, Textarea } from '@/components/ui/Campo';
import { Tarjeta, TituloTarjeta } from '@/components/ui/Tarjeta';
import { Insignia } from '@/components/ui/Insignia';
import type { Estatus } from '@/types';

/** Nota pública sugerida por estatus: el operador solo la ajusta si hace falta. */
const NOTA_SUGERIDA: Record<Estatus, string> = {
  registrado: 'Envío registrado en el sistema.',
  recolectado: 'Recolectamos tu paquete.',
  en_bodega: 'Tu paquete está en nuestra bodega de origen.',
  en_transito: 'Tu paquete va en camino a la ciudad destino.',
  en_destino: 'Tu paquete llegó a la ciudad destino.',
  en_reparto: 'Tu paquete salió a reparto. Hoy lo recibes.',
  entregado: 'Paquete entregado. ¡Gracias por confiar en nosotros!',
  incidencia: 'Hubo un contratiempo con tu envío. Te contactamos en breve.',
  cancelado: 'El envío fue cancelado.',
};

export function CambiarEstatus({
  folio,
  estatusActual,
  onCambio,
}: {
  folio: string;
  estatusActual: Estatus;
  /** Se llama al confirmar, para que la página recargue los datos. */
  onCambio: () => void;
}) {
  const { usuarioActual } = useSesion();
  const opciones = useMemo(() => transicionesValidas(estatusActual), [estatusActual]);

  const [nuevo, setNuevo] = useState<Estatus | ''>('');
  const [nota, setNota] = useState('');
  const [notaInterna, setNotaInterna] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function elegir(estatus: Estatus | '') {
    setNuevo(estatus);
    // Se precarga la nota sugerida, pero el operador manda: puede reescribirla.
    setNota(estatus ? NOTA_SUGERIDA[estatus] : '');
    setError(null);
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevo || !nota.trim() || !usuarioActual || guardando) return;

    setGuardando(true);
    setError(null);

    try {
      await cambiarEstatus(folio, nuevo, {
        nota: nota.trim(),
        notaInterna: notaInterna.trim(),
        usuario: usuarioActual,
      });
      setNuevo('');
      setNota('');
      setNotaInterna('');
      onCambio();
    } catch {
      setError('No se pudo guardar el cambio. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  if (opciones.length === 0) {
    return (
      <Tarjeta>
        <TituloTarjeta>Cambiar estatus</TituloTarjeta>
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <Lock className="mt-0.5 size-5 shrink-0 text-slate-500" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-slate-200">Este envío ya está cerrado</p>
            <p className="mt-1 text-slate-400">
              Está en <Insignia estatus={estatusActual} className="mx-0.5 align-middle" />, que es
              un estatus final. Ya no admite más cambios.
            </p>
          </div>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta>
      <TituloTarjeta>Cambiar estatus</TituloTarjeta>

      <form onSubmit={confirmar} className="space-y-4">
        <Select
          id="nuevoEstatus"
          etiqueta="Nuevo estatus"
          required
          value={nuevo}
          onChange={(e) => elegir(e.target.value as Estatus | '')}
          ayuda="Solo se ofrecen los cambios válidos desde el estatus actual."
        >
          <option value="">Elige el nuevo estatus…</option>
          {opciones.map((e) => (
            <option key={e} value={e}>
              {etiqueta(e)}
            </option>
          ))}
        </Select>

        {nuevo && (
          <>
            <Textarea
              id="nota"
              etiqueta="Nota para el cliente"
              required
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              ayuda="Esto SÍ lo ve el cliente en su página de rastreo."
            />

            <Input
              id="notaInterna"
              etiqueta="Nota interna (opcional)"
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
              ayuda="Solo la ve el personal. Nunca sale al rastreo público."
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
              >
                {error}
              </p>
            )}

            <Boton
              type="submit"
              tamano="lg"
              anchoCompleto
              cargando={guardando}
              // Sin nota pública no se guarda: el cliente se quedaría sin explicación.
              disabled={!nota.trim() || !usuarioActual}
            >
              {!guardando && <CheckCircle2 className="size-5" aria-hidden="true" />}
              Confirmar cambio a “{etiqueta(nuevo)}”
            </Boton>
          </>
        )}
      </form>
    </Tarjeta>
  );
}
