
'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DelegationCategory } from '@/types';

interface DelegationItemButtonProps {
  itemName: string;
  icon: ReactNode;
  onClick: () => void;
  category: DelegationCategory; // Made category required
}

export function DelegationItemButton({ itemName, icon, onClick, category }: DelegationItemButtonProps) {
  const hoverClasses = category === 'Souscription'
    ? 'hover:bg-accent-light hover:text-accent-foreground hover:border-accent-light/70 hover:shadow-md'
    : 'hover:bg-secondary hover:text-secondary-foreground hover:border-primary hover:shadow-md';

  return (
    <Button
      variant="outline"
      className={cn(
        "h-auto w-full flex-col items-start justify-start p-4 text-left shadow-sm transition-all",
        // The base "outline" variant is: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        // The hoverClasses below will be merged. 
        // For Souscription: hover:bg-accent-light should override hover:bg-accent.
        // For Actes de Gestion: hover:bg-secondary should override hover:bg-accent.
        hoverClasses
      )}
      onClick={onClick}
    >
      <div className="mb-2 flex items-center justify-center rounded-md bg-primary/10 p-2 text-primary">
        {icon}
      </div>
      <span className="text-base font-medium text-foreground">{itemName}</span>
      <span className="text-xs text-muted-foreground">Initiate new {itemName.toLowerCase()}</span>
    </Button>
  );
}
