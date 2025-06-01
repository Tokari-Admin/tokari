
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { DelegationCategory, DelegationItem, DelegationStatus } from '@/types';

const formSchema = z.object({
  clientName: z.string().min(2, { message: "Client name must be at least 2 characters." }),
  amount: z.coerce.number().positive({ message: "Investment amount must be positive." }),
  productType: z.string().optional(),
  riskProfile: z.enum(["Prudent", "Equilibré", "Dynamique", "Autre"]).optional(),
  notes: z.string().optional(),
});

type AssuranceVieFormValues = z.infer<typeof formSchema>;

interface AssuranceVieFormProps {
  onFormSubmitSuccess: () => void;
  onCancel: () => void;
}

export function AssuranceVieForm({ onFormSubmitSuccess, onCancel }: AssuranceVieFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AssuranceVieFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      amount: undefined,
      productType: '',
      riskProfile: undefined,
      notes: '',
    },
  });

  async function onSubmit(values: AssuranceVieFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);

    try {
      const delegationData: Omit<DelegationItem, 'id' | 'createdDate'> & { createdDate: any; lastModifiedDate: any } = {
        userId: user.uid,
        type: "Assurance Vie",
        category: "Souscription" as DelegationCategory,
        clientName: values.clientName,
        status: 'En attente' as DelegationStatus,
        notes: values.notes,
        details: {
          amount: values.amount,
          productType: values.productType,
          riskProfile: values.riskProfile,
        },
        createdDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(),
      };

      await addDoc(collection(db, 'delegations'), delegationData);
      toast({ title: 'Delegation "Assurance Vie" Created', description: `Souscription for ${values.clientName} recorded successfully.` });
      form.reset();
      onFormSubmitSuccess();
    } catch (error: any) {
      console.error("Error saving Assurance Vie delegation:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save delegation.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Nouvelle Souscription: Assurance Vie</CardTitle>
        <CardDescription>
          Remplissez les détails ci-dessous pour la nouvelle souscription d&apos;assurance vie.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom Complet du Client</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant de l&apos;Investissement (€)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de Produit/Support (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fonds Euro, ETF Monde..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profil de Risque (Optionnel)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un profil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Prudent">Prudent</SelectItem>
                      <SelectItem value="Equilibré">Equilibré</SelectItem>
                      <SelectItem value="Dynamique">Dynamique</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Informations complémentaires..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer la Souscription
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
