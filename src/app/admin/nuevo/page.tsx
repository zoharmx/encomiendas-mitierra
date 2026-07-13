'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FormNuevoEnvio } from '@/components/admin/FormNuevoEnvio';

export default function PaginaNuevoEnvio() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a envíos
        </Link>
        <h1 className="text-2xl font-bold text-white">Nuevo envío</h1>
        <p className="text-sm text-slate-400">
          El folio se genera solo al guardar. No hace falta inventarlo.
        </p>
      </div>

      <FormNuevoEnvio />
    </div>
  );
}
