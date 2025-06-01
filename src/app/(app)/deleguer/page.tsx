'use client';

import { useState } from 'react';
import { FilePlus, Settings2, ShieldCheck, TrendingUp, Building, GitCompareArrows } from 'lucide-react';
import { DelegationCategoryCard } from '@/components/delegation/delegation-category-card';
import { DelegationItemButton } from '@/components/delegation/delegation-item-button';
import { DelegationModal } from '@/components/delegation/delegation-modal';
import type { DelegationCategory, DelegationType } from '@/types';
import { DelegationSubCategories } from '@/types';

const categoryIcons = {
  Souscription: <FilePlus className="h-8 w-8" />,
  "Actes de Gestion": <Settings2 className="h-8 w-8" />,
};

const itemIcons: Record<DelegationType, React.ReactNode> = {
  "Assurance Vie": <ShieldCheck className="h-6 w-6" />,
  "PER": <TrendingUp className="h-6 w-6" />,
  "SCPI Pleine Propriété": <Building className="h-6 w-6" />,
  "SCPI Nue Propriété": <Building className="h-6 w-6" />,
  "Arbitrage": <GitCompareArrows className="h-6 w-6" />,
};


export default function DeleguerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDelegationType, setSelectedDelegationType] = useState<DelegationType | null>(null);
  const [selectedDelegationCategory, setSelectedDelegationCategory] = useState<DelegationCategory | null>(null);

  const handleItemClick = (itemType: DelegationType, itemCategory: DelegationCategory) => {
    setSelectedDelegationType(itemType);
    setSelectedDelegationCategory(itemCategory);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          Déléguer une Opération
        </h1>
        <p className="text-muted-foreground">
          Choisissez une catégorie et un type d&apos;opération à déléguer.
        </p>
      </header>

      <div className="space-y-8">
        {(Object.keys(DelegationSubCategories) as DelegationCategory[]).map((category, index) => (
          <DelegationCategoryCard
            key={category}
            categoryName={category}
            icon={categoryIcons[category]}
            defaultOpen={index === 0}
          >
            {DelegationSubCategories[category].map((item) => (
              <DelegationItemButton
                key={item}
                itemName={item}
                icon={itemIcons[item as DelegationType]}
                onClick={() => handleItemClick(item as DelegationType, category)}
              />
            ))}
          </DelegationCategoryCard>
        ))}
      </div>

      {selectedDelegationType && selectedDelegationCategory && (
        <DelegationModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          delegationType={selectedDelegationType}
          delegationCategory={selectedDelegationCategory}
        />
      )}
    </div>
  );
}
