import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Sin padding interno: útil cuando la tarjeta envuelve una tabla. */
  sinPadding?: boolean;
}

export function Tarjeta({ className, sinPadding, children, ...props }: Props) {
  return (
    <div
      {...props}
      className={cn(
        'vidrio rounded-2xl shadow-xl shadow-black/20',
        !sinPadding && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TituloTarjeta({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h2>
  );
}
