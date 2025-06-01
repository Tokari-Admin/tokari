'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { recommendDelegationWorkflow, RecommendDelegationWorkflowOutput } from '@/ai/flows/recommend-delegation-workflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const formSchema = z.object({
  clientProfile: z.string().min(50, { message: 'Client profile must be at least 50 characters.' }),
  financialGoals: z.string().min(30, { message: 'Financial goals must be at least 30 characters.' }),
});

export function RecommendationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendDelegationWorkflowOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientProfile: '',
      financialGoals: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecommendation(null);
    try {
      const result = await recommendDelegationWorkflow(values);
      setRecommendation(result);
      toast({ title: 'Recommendation Generated', description: 'AI workflow recommendation is ready.' });
    } catch (error: any) {
      console.error('AI Recommendation error:', error);
      toast({
        variant: 'destructive',
        title: 'Recommendation Failed',
        description: error.message || 'Could not generate recommendation.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Get AI-Powered Recommendation</CardTitle>
          <CardDescription>
            Provide client details and financial goals to receive an optimal delegation workflow recommendation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="clientProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Profile</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the client's financial history, risk tolerance, investment preferences, etc."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="financialGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detail the client's financial goals like retirement planning, wealth accumulation, estate planning, etc."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Recommendation
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating recommendation...</p>
          </CardContent>
        </Card>
      )}

      {recommendation && !isLoading && (
        <Card className="mt-8 bg-primary-foreground">
          <CardHeader>
            <CardTitle className="font-headline text-primary">AI Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-1">Workflow Recommendation:</h4>
              <p className="text-foreground whitespace-pre-wrap">{recommendation.workflowRecommendation}</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Rationale:</h4>
              <p className="text-foreground whitespace-pre-wrap">{recommendation.rationale}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
