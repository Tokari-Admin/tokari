'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DelegationItemButtonProps {
  itemName: string;
  icon: ReactNode;
  onClick: () => void;
}

export function DelegationItemButton({ itemName, icon, onClick }: DelegationItemButtonProps) {
  return (
    <Button
      variant="outline"
      className="h-auto w-full flex-col items-start justify-start p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary"
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
