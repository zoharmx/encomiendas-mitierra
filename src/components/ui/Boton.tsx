import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'whatsapp';
type Tamano = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-gradient-to-r from-[var(--color-marca-de)] to-[var(--color-marca-a)] text-white shadow-lg shadow-blue-500/20 hover:brightness-110',
  secundario:
    'vidrio text-slate-100 hover:bg-white/10',
  fantasma:
    'text-slate-300 hover:bg-white/5 hover:text-white',
  peligro:
    'bg-rose-600 text-white hover:bg-rose-500',
  whatsapp:
    'bg-emerald-600 text-white hover:bg-emerald-500',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  // Botones grandes: el operador los usa a diario, muchas veces desde el celular.
  lg: 'h-14 px-6 text-base gap-2.5',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  anchoCompleto?: boolean;
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  anchoCompleto = false,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAMANOS[tamano],
        anchoCompleto && 'w-full',
        className,
      )}
    >
      {cargando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
