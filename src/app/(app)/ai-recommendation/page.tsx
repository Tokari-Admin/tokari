'use client';

import { RecommendationForm } from '@/components/ai/recommendation-form';

export default function AiRecommendationPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          AI Workflow Recommendation
        </h1>
        <p className="text-muted-foreground">
          Leverage AI to find optimal delegation workflows for your clients.
        </p>
      </header>
      <RecommendationForm />
    </div>
  );
}
