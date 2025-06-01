'use client';

import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { DelegationCategory } from '@/types';

interface DelegationCategoryCardProps {
  categoryName: DelegationCategory;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function DelegationCategoryCard({ categoryName, icon, children, defaultOpen = false }: DelegationCategoryCardProps) {
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen ? "item-1" : undefined} className="w-full rounded-lg border bg-card shadow-sm">
      <AccordionItem value="item-1" className="border-b-0">
        <AccordionTrigger className="px-6 py-4 hover:no-underline">
          <div className="flex items-center gap-3">
            <span className="text-primary">{icon}</span>
            <h3 className="font-headline text-xl font-semibold text-card-foreground">
              {categoryName}
            </h3>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-1 gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
