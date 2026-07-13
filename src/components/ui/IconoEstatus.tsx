import {
  AlertTriangle,
  Bike,
  CheckCircle,
  FilePlus,
  MapPin,
  Package,
  PackageCheck,
  Truck,
  Warehouse,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { ESTATUS_META, type Estatus } from '@/types';

/**
 * Traduce el nombre de ícono del catálogo (ESTATUS_META) a un componente lucide.
 *
 * El catálogo guarda strings ('truck') y no componentes, para que types/index.ts
 * siga siendo un archivo de datos puro, reutilizable fuera de React.
 * Si agregas un estatus con un ícono nuevo, regístralo aquí.
 */
const ICONOS: Record<string, LucideIcon> = {
  'file-plus': FilePlus,
  'package-check': PackageCheck,
  warehouse: Warehouse,
  truck: Truck,
  'map-pin': MapPin,
  bike: Bike,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'x-circle': XCircle,
};

export function IconoEstatus({
  estatus,
  className = 'size-5',
}: {
  estatus: Estatus;
  className?: string;
}) {
  const Icono = ICONOS[ESTATUS_META[estatus].icono] ?? Package;
  return <Icono className={className} aria-hidden="true" />;
}
