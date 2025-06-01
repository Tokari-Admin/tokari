
'use client';

import { useState, useEffect } from 'react';
import { FilePlus, Settings2, ShieldCheck, TrendingUp, Building, GitCompareArrows, ChevronLeft } from 'lucide-react';
import { DelegationCategoryCard } from '@/components/delegation/delegation-category-card';
import { DelegationItemButton } from '@/components/delegation/delegation-item-button';
import type { DelegationCategory, DelegationType } from '@/types';
import { DelegationSubCategories, getCategoryForType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth'; 

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

const TALLY_URLS: Partial<Record<DelegationType, string>> = {
  "PER": "https://tally.so/embed/mB2Wg5",
  "Assurance Vie": "https://tally.so/embed/mKa4yX",
  "SCPI Nue Propriété": "https://tally.so/embed/wAjXpD",
  "SCPI Pleine Propriété": "https://tally.so/embed/nrkZ5R",
  "Arbitrage": "https://tally.so/embed/mOoN7R",
};

const TALLY_DEFAULT_PARAMS = "alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1";

export default function DeleguerPage() {
  const { user } = useAuth(); 
  const [currentTallyDelegationType, setCurrentTallyDelegationType] = useState<DelegationType | null>(null);
  const [currentTallyEmbedUrl, setCurrentTallyEmbedUrl] = useState<string | null>(null);

  const handleItemClick = (itemType: DelegationType) => {
    setCurrentTallyDelegationType(itemType);
    const baseEmbedUrl = TALLY_URLS[itemType];

    if (baseEmbedUrl && user) { 
      const queryParams = new URLSearchParams(TALLY_DEFAULT_PARAMS);
      queryParams.append('userId', user.uid);
      queryParams.append('delegationType', itemType);
      setCurrentTallyEmbedUrl(`${baseEmbedUrl}?${queryParams.toString()}`);
    } else if (baseEmbedUrl) {
       const queryParams = new URLSearchParams(TALLY_DEFAULT_PARAMS);
       queryParams.append('delegationType', itemType); 
       setCurrentTallyEmbedUrl(`${baseEmbedUrl}?${queryParams.toString()}`);
       console.warn("User not available for Tally URL, userId not included.");
    } else {
      const placeholderHtml = `
        <body style='font-family:sans-serif;display:flex;flex-direction:column;justify-content:center;align-items:center;height:80vh;margin:0;padding:20px;text-align:center;color:%234b5563;background-color:%23f9fafb;border-radius:8px;'>
          <h2 style='color:%231f2937;margin-bottom:8px;'>Formulaire pour ${itemType}</h2>
          <p style="font-size:0.9em;max-width:400px;color:%236b7280;">
            Le formulaire Tally sp&eacute;cifique pour ce type d&apos;op&eacute;ration (<strong>${itemType}</strong>) n&apos;est pas encore configur&eacute;.
            Veuillez fournir l&apos;URL d&apos;int&eacute;gration Tally appropri&eacute;e.
          </p>
        </body>`;
      setCurrentTallyEmbedUrl(`data:text/html,${encodeURIComponent(placeholderHtml)}`);
    }
  };

  if (currentTallyDelegationType && currentTallyEmbedUrl) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0">
        <Button
          variant="outline"
          onClick={() => {
            setCurrentTallyDelegationType(null);
            setCurrentTallyEmbedUrl(null);
          }}
          className="mb-6 flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Retour à la sélection
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Nouvelle délégation: {currentTallyDelegationType}
            </CardTitle>
            <CardDescription>
              {TALLY_URLS[currentTallyDelegationType]
                ? "Veuillez remplir le formulaire Tally ci-dessous. Une fois la demande de délégation envoyée, celle-ci sera traitée et devrait apparaître dans 'Mes Opérations' si le webhook est correctement configuré."
                : "Configuration du formulaire Tally pour ce type d'opération requise."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <iframe
              src={currentTallyEmbedUrl}
              width="100%"
              style={{ minHeight: '750px', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
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
                category={category} 
              />
            ))}
          </DelegationCategoryCard>
        ))}
      </div>
    </div>
  );
}
