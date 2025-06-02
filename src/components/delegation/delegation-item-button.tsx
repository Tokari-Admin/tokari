
'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DelegationCategory } from '@/types';

interface DelegationItemButtonProps {
  itemName: string;
  icon: ReactNode;
  onClick: () => void;
  category: DelegationCategory;
}

export function DelegationItemButton({ itemName, icon, onClick, category }: DelegationItemButtonProps) {
  let hoverClasses = '';

  if (category === 'Souscription' || itemName === 'Arbitrage') {
    // Light purple background, dark purple text
    hoverClasses = 'hover:bg-accent-light hover:text-accent hover:border-accent-light/70 hover:shadow-md';
  } else if (category === 'Actes de Gestion') {
    // Light blue background, default secondary foreground text
    hoverClasses = 'hover:bg-secondary hover:text-secondary-foreground hover:border-primary hover:shadow-md';
  } else {
    // Default hover from button variant
    hoverClasses = 'hover:bg-accent hover:text-accent-foreground';
  }

  return (
    <Button
      variant="outline"
      className={cn(
        "h-auto w-full flex-col items-start justify-start p-4 text-left shadow-sm transition-all",
        hoverClasses
      )}
      onClick={onClick}
    >
      <div className="mb-2 flex items-center justify-center rounded-md bg-primary/10 p-2 text-primary">
        {icon}
      </div>
      <span className="text-base font-medium text-foreground">{itemName}</span>
    </Button>
  );
}
