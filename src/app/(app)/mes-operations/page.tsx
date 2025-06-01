'use client';

import { OperationsTable } from '@/components/delegation/operations-table';

export default function MesOperationsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          Mes Opérations
        </h1>
        <p className="text-muted-foreground">
          Suivez et gérez toutes vos opérations déléguées.
        </p>
      </header>
      <OperationsTable />
    </>
  );
}
