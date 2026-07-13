import { colorEstatus, etiqueta } from '@/lib/estatus';
import { cn } from '@/lib/cn';
import { IconoEstatus } from '@/components/ui/IconoEstatus';
import type { Estatus } from '@/types';

export function Insignia({
  estatus,
  conIcono = true,
  className,
}: {
  estatus: Estatus;
  conIcono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        colorEstatus(estatus),
        className,
      )}
    >
      {conIcono && <IconoEstatus estatus={estatus} className="size-3.5" />}
      {etiqueta(estatus)}
    </span>
  );
}
