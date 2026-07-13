import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const BASE =
  'w-full rounded-xl bg-white/5 border border-white/10 px-4 text-slate-100 placeholder:text-slate-500 ' +
  'transition focus:border-blue-400/60 focus:bg-white/[0.07] focus:outline-none ' +
  'focus:ring-2 focus:ring-blue-400/30 disabled:opacity-50';

/** Etiqueta + control + error/ayuda. El error se anuncia a lectores de pantalla. */
function Envoltura({
  etiqueta,
  htmlFor,
  error,
  ayuda,
  requerido,
  children,
}: {
  etiqueta?: string;
  htmlFor?: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {etiqueta && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300">
          {etiqueta}
          {requerido && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-slate-500">{ayuda}</p>
      )}
    </div>
  );
}

interface PropsInput extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
}

export function Input({ etiqueta, error, ayuda, className, id, required, ...props }: PropsInput) {
  return (
    <Envoltura etiqueta={etiqueta} htmlFor={id} error={error} ayuda={ayuda} requerido={required}>
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(BASE, 'h-11', error && 'border-rose-500/60', className)}
      />
    </Envoltura>
  );
}

interface PropsSelect extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
}

export function Select({ etiqueta, error, ayuda, className, id, required, children, ...props }: PropsSelect) {
  return (
    <Envoltura etiqueta={etiqueta} htmlFor={id} error={error} ayuda={ayuda} requerido={required}>
      <select
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(BASE, 'h-11 [&>option]:bg-slate-900', error && 'border-rose-500/60', className)}
      >
        {children}
      </select>
    </Envoltura>
  );
}

interface PropsTextarea extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
}

export function Textarea({ etiqueta, error, ayuda, className, id, required, ...props }: PropsTextarea) {
  return (
    <Envoltura etiqueta={etiqueta} htmlFor={id} error={error} ayuda={ayuda} requerido={required}>
      <textarea
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(BASE, 'min-h-24 py-3 resize-y', error && 'border-rose-500/60', className)}
      />
    </Envoltura>
  );
}
