'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Metricas } from '@/components/admin/Metricas';
import { TablaEnvios } from '@/components/admin/TablaEnvios';
import { Boton } from '@/components/ui/Boton';

export default function PanelEnvios() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Envíos</h1>
          <p className="text-sm text-slate-400">Todos los envíos, del más reciente al más viejo.</p>
        </div>
        <Link href="/admin/nuevo">
          <Boton tamano="lg">
            <PlusCircle className="size-5" aria-hidden="true" />
            Nuevo envío
          </Boton>
        </Link>
      </div>

      <Metricas />
      <TablaEnvios />
    </div>
  );
}
