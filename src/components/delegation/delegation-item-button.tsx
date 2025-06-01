'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DelegationCategory } from '@/types';

interface DelegationItemButtonProps {
  itemName: string;
  icon: ReactNode;
  onClick: () => void;
  category?: DelegationCategory;
}

export function DelegationItemButton({ itemName, icon, onClick, category }: DelegationItemButtonProps) {
  const hoverClasses = category === 'Souscription'
    ? 'hover:border-accent-light hover:shadow-md' // Lighter purple border for Souscription
    : 'hover:border-primary hover:shadow-md'; // Default blue border for others

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
      <span className="text-xs text-muted-foreground">Initiate new {itemName.toLowerCase()}</span>
    </Button>
  );
}
