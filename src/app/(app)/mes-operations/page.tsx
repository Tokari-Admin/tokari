'use client';

import { OperationsTable } from '@/components/delegation/operations-table';

export default function MesOperationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          Mes Opérations
        </h1>
        <p className="text-muted-foreground">
          Suivez et gérez toutes vos opérations déléguées.
        </p>
      </header>
      <OperationsTable />
    </div>
  );
}
