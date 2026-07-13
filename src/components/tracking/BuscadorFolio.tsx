'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { REGEX_FOLIO } from '@/lib/config';
import { Boton } from '@/components/ui/Boton';

/**
 * Campo de folio. Normaliza a mayúsculas mientras se escribe: el folio que el
 * cliente copia de WhatsApp suele venir en minúsculas o con espacios sobrantes.
 */
export function BuscadorFolio({
  valorInicial = '',
  onBuscar,
  cargando = false,
  autoFocus = false,
}: {
  valorInicial?: string;
  onBuscar: (folio: string) => void;
  cargando?: boolean;
  autoFocus?: boolean;
}) {
  const [folio, setFolio] = useState(valorInicial);
  const limpio = folio.trim().toUpperCase();
  const formatoOk = REGEX_FOLIO.test(limpio);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (limpio) onBuscar(limpio);
  }

  return (
    <form onSubmit={enviar} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            value={folio}
            onChange={(e) => setFolio(e.target.value.toUpperCase())}
            placeholder="EMT-0001-K3F9"
            aria-label="Número de folio"
            autoFocus={autoFocus}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="h-14 w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 font-mono text-lg tracking-wide text-white placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-slate-500 focus:border-blue-400/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
          />
        </div>

        <Boton type="submit" tamano="lg" cargando={cargando} disabled={!limpio}>
          Rastrear
        </Boton>
      </div>

      {/* Aviso suave, no un error: puede que el negocio use otro formato de folio viejo. */}
      {limpio.length > 3 && !formatoOk && (
        <p className="mt-2 text-sm text-slate-500">
          Los folios se ven así: <span className="font-mono text-slate-400">EMT-0001-K3F9</span>
        </p>
      )}
    </form>
  );
}
