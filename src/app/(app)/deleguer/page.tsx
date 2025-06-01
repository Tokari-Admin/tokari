
'use client';

import { useState } from 'react';
import { FilePlus, Settings2, ShieldCheck, TrendingUp, Building, GitCompareArrows, ChevronLeft } from 'lucide-react';
import { DelegationCategoryCard } from '@/components/delegation/delegation-category-card';
import { DelegationItemButton } from '@/components/delegation/delegation-item-button';
import type { DelegationCategory, DelegationType } from '@/types';
import { DelegationSubCategories } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

const TALLY_EMBED_URL = "https://tally.so/embed/mB2Wg5?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

export default function DeleguerPage() {
  const [currentTallyDelegationType, setCurrentTallyDelegationType] = useState<DelegationType | null>(null);

  const handleItemClick = (itemType: DelegationType) => {
    setCurrentTallyDelegationType(itemType);
  };

  if (currentTallyDelegationType) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0">
        <Button variant="outline" onClick={() => setCurrentTallyDelegationType(null)} className="mb-6 flex items-center">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Retour à la sélection
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Nouvelle délégation: {currentTallyDelegationType}
            </CardTitle>
            <CardDescription>
              Veuillez remplir le formulaire ci-dessous pour initier la délégation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              src={TALLY_EMBED_URL}
              width="100%"
              style={{ minHeight: '750px', border: 'none' }}
              title={`Formulaire de délégation: ${currentTallyDelegationType}`}
              allowFullScreen
            >
              Chargement du formulaire...
            </iframe>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                onClick={() => handleItemClick(item as DelegationType)}
              />
            ))}
          </DelegationCategoryCard>
        ))}
      </div>
    </div>
  );
}
