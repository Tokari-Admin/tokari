
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { DelegationCategory, DelegationItem, DelegationStatus } from '@/types';

const formSchema = z.object({
  subscriberLastName: z.string().min(1, { message: "Nom du souscripteur est requis." }),
  subscriberFirstName: z.string().min(1, { message: "Prénom du souscripteur est requis." }),
  hasCoSubscriber: z.boolean().optional().default(false),
  coSubscriberLastName: z.string().optional(),
  coSubscriberFirstName: z.string().optional(),
  contractName: z.enum([
    "Cristalliance Avenir - VIE PLUS",
    "Cristalliance Evoluvie - APICIL",
    "Fipavie Neo - ODDO"
  ], { required_error: "Nom du contrat est requis." }),
  initialPaymentAmount: z.union([z.literal(''), z.coerce.number().nonnegative({ message: "Le versement initial doit être un nombre positif ou zéro." })]).optional(),
  scheduledPaymentAmount: z.union([z.literal(''), z.coerce.number().nonnegative({ message: "Le versement programmé doit être un nombre positif ou zéro." })]).optional(),
  scheduledPaymentDebitDay: z.enum(["05", "15", "25", "Autre"]).optional(),
  scheduledPaymentOtherDate: z.string().optional(),
  beneficiaryClause: z.enum([
    "Clause bénéficiaire générale",
    "Clause bénéficiaire libre"
  ], { required_error: "Clause bénéficiaire est requise." }),
  customBeneficiaryClause: z.string().optional(),
  assetAllocationChoice: z.enum([
    "Utiliser l'allocation d'actifs que j'ai déjà importé",
    "Importer une autre allocation d'actifs"
  ], { required_error: "Allocation d'actifs est requise." }),
  customAssetAllocation: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.hasCoSubscriber) {
    if (!data.coSubscriberLastName || data.coSubscriberLastName.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nom du co-souscripteur est requis.", path: ['coSubscriberLastName'] });
    }
    if (!data.coSubscriberFirstName || data.coSubscriberFirstName.trim() === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Prénom du co-souscripteur est requis.", path: ['coSubscriberFirstName'] });
    }
  }
  
  // When validating, data.scheduledPaymentAmount can be a string (e.g. '500' or '') or number
  const scheduledPaymentAmountValue = Number(data.scheduledPaymentAmount);

  if (scheduledPaymentAmountValue > 0 && !data.scheduledPaymentDebitDay) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date de prélèvement est requise si un versement programmé est saisi.", path: ['scheduledPaymentDebitDay'] });
  }
  if (scheduledPaymentAmountValue > 0 && data.scheduledPaymentDebitDay === "Autre" && (!data.scheduledPaymentOtherDate || data.scheduledPaymentOtherDate.trim() === "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Veuillez préciser l'autre date (JJ/MM).", path: ['scheduledPaymentOtherDate'] });
  }

  if (data.beneficiaryClause === "Clause bénéficiaire libre" && (!data.customBeneficiaryClause || data.customBeneficiaryClause.trim() === "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Veuillez détailler la clause bénéficiaire libre.", path: ['customBeneficiaryClause'] });
  }
  if (data.assetAllocationChoice === "Importer une autre allocation d'actifs" && (!data.customAssetAllocation || data.customAssetAllocation.trim() === "")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Veuillez décrire l'allocation d'actifs ou fournir un lien.", path: ['customAssetAllocation'] });
  }
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
      subscriberLastName: '',
      subscriberFirstName: '',
      hasCoSubscriber: false,
      coSubscriberLastName: '',
      coSubscriberFirstName: '',
      contractName: undefined,
      initialPaymentAmount: '',
      scheduledPaymentAmount: '',
      scheduledPaymentDebitDay: undefined,
      scheduledPaymentOtherDate: '',
      beneficiaryClause: undefined,
      customBeneficiaryClause: '',
      assetAllocationChoice: undefined,
      customAssetAllocation: '',
      notes: '',
    },
  });

  const watchHasCoSubscriber = form.watch('hasCoSubscriber');
  // Use form.watch() directly in JSX for conditional rendering related to these fields
  // const watchScheduledPaymentAmountValue = form.watch('scheduledPaymentAmount');
  // const watchScheduledPaymentDebitDay = form.watch('scheduledPaymentDebitDay');
  const watchBeneficiaryClause = form.watch('beneficiaryClause');
  const watchAssetAllocationChoice = form.watch('assetAllocationChoice');

  async function onSubmit(values: AssuranceVieFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);

    try {
      const clientFullName = `${values.subscriberFirstName} ${values.subscriberLastName}`;
      const numericInitialPayment = values.initialPaymentAmount === '' ? undefined : Number(values.initialPaymentAmount);
      const numericScheduledPayment = values.scheduledPaymentAmount === '' ? undefined : Number(values.scheduledPaymentAmount);

      const delegationData: Omit<DelegationItem, 'id' | 'createdDate'> & { createdDate: any; lastModifiedDate: any } = {
        userId: user.uid,
        type: "Assurance Vie",
        category: "Souscription" as DelegationCategory,
        clientName: clientFullName,
        status: 'En attente' as DelegationStatus,
        notes: values.notes,
        details: {
          subscriberFirstName: values.subscriberFirstName,
          subscriberLastName: values.subscriberLastName,
          hasCoSubscriber: values.hasCoSubscriber,
          coSubscriberFirstName: values.hasCoSubscriber ? values.coSubscriberFirstName : undefined,
          coSubscriberLastName: values.hasCoSubscriber ? values.coSubscriberLastName : undefined,
          contractName: values.contractName,
          initialPaymentAmount: numericInitialPayment,
          scheduledPaymentAmount: numericScheduledPayment,
          scheduledPaymentDebitDay: (numericScheduledPayment && numericScheduledPayment > 0) ? values.scheduledPaymentDebitDay : undefined,
          scheduledPaymentOtherDate: (numericScheduledPayment && numericScheduledPayment > 0 && values.scheduledPaymentDebitDay === "Autre") ? values.scheduledPaymentOtherDate : undefined,
          beneficiaryClause: values.beneficiaryClause,
          customBeneficiaryClause: values.beneficiaryClause === "Clause bénéficiaire libre" ? values.customBeneficiaryClause : undefined,
          assetAllocationChoice: values.assetAllocationChoice,
          customAssetAllocation: values.assetAllocationChoice === "Importer une autre allocation d'actifs" ? values.customAssetAllocation : undefined,
        },
        createdDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(),
      };

      await addDoc(collection(db, 'delegations'), delegationData);
      toast({ title: 'Délégation "Assurance Vie" Créée', description: `Souscription pour ${clientFullName} enregistrée.` });
      form.reset();
      onFormSubmitSuccess();
    } catch (error: any) {
      console.error("Error saving Assurance Vie delegation:", error);
      toast({ variant: 'destructive', title: 'Échec de l\'enregistrement', description: error.message || 'Impossible d\'enregistrer la délégation.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Nouvelle Souscription: Assurance Vie</CardTitle>
        <CardDescription>
          Remplissez les détails ci-dessous pour la nouvelle souscription d&apos;assurance vie. Les champs marqués d&apos;un * sont requis.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="subscriberLastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom souscripteur *</FormLabel>
                  <FormControl><Input placeholder="STARK" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subscriberFirstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom souscripteur *</FormLabel>
                  <FormControl><Input placeholder="Tony" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasCoSubscriber"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Ajouter un co-souscripteur</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            {watchHasCoSubscriber && (
              <>
                <FormField
                  control={form.control}
                  name="coSubscriberLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom co-souscripteur *</FormLabel>
                      <FormControl><Input placeholder="POTTS" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coSubscriberFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom co-souscripteur *</FormLabel>
                      <FormControl><Input placeholder="Pepper" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="contractName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du contrat *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Cristalliance Avenir - VIE PLUS" /></FormControl>
                        <FormLabel className="font-normal">Cristalliance Avenir - VIE PLUS</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Cristalliance Evoluvie - APICIL" /></FormControl>
                        <FormLabel className="font-normal">Cristalliance Evoluvie - APICIL</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Fipavie Neo - ODDO" /></FormControl>
                        <FormLabel className="font-normal">Fipavie Neo - ODDO</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialPaymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versement initial (€)</FormLabel>
                  <FormControl><Input type="number" placeholder="Entrer le montant du VI" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="scheduledPaymentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versement programmé (€)</FormLabel>
                  {/* Removed custom onChange that parsed to float, rely on string and coerce */}
                  <FormControl><Input type="number" placeholder="Entrer le montant du VP" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional section for scheduled payment debit day */}
            {Number(form.watch('scheduledPaymentAmount')) > 0 && (
              <>
                <FormField
                  control={form.control}
                  name="scheduledPaymentDebitDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de prélèvement du versement programmé *</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="05" /></FormControl>
                            <FormLabel className="font-normal">Le 05 du mois</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="15" /></FormControl>
                            <FormLabel className="font-normal">Le 15 du mois</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="25" /></FormControl>
                            <FormLabel className="font-normal">Le 25 du mois</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="Autre" /></FormControl>
                            <FormLabel className="font-normal">Choisir une autre date</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('scheduledPaymentDebitDay') === "Autre" && (
                  <FormField
                    control={form.control}
                    name="scheduledPaymentOtherDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autre date de prélèvement (JJ/MM) *</FormLabel>
                        <FormControl><Input placeholder="ex: 10/03" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
            
            <FormField
              control={form.control}
              name="beneficiaryClause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clause bénéficiaire *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Clause bénéficiaire générale" /></FormControl>
                        <FormLabel className="font-normal">Clause bénéficiaire générale</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Clause bénéficiaire libre" /></FormControl>
                        <FormLabel className="font-normal">Clause bénéficiaire libre</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchBeneficiaryClause === "Clause bénéficiaire libre" && (
              <FormField
                control={form.control}
                name="customBeneficiaryClause"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Détail de la clause bénéficiaire libre *</FormLabel>
                    <FormControl><Textarea placeholder="Décrivez la clause bénéficiaire..." {...field} className="min-h-[100px]" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="assetAllocationChoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocation d&apos;actifs (AT) *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Utiliser l'allocation d'actifs que j'ai déjà importé" /></FormControl>
                        <FormLabel className="font-normal">Utiliser l&apos;allocation d&apos;actifs que j&apos;ai déjà importé</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Importer une autre allocation d'actifs" /></FormControl>
                        <FormLabel className="font-normal">Importer une autre allocation d&apos;actifs</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchAssetAllocationChoice === "Importer une autre allocation d'actifs" && (
              <FormField
                control={form.control}
                name="customAssetAllocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Détail de l&apos;autre allocation d&apos;actifs *</FormLabel>
                    <FormControl><Textarea placeholder="Décrivez l'allocation ou fournissez un lien..." {...field} className="min-h-[100px]" /></FormControl>
                    <FormDescription>
                      La fonctionnalité d&apos;import direct de fichier sera ajoutée ultérieurement. Pour l&apos;instant, veuillez décrire ou coller un lien.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire</FormLabel>
                  <FormControl><Textarea placeholder="Partagez toutes les informations que vous jugerez utiles..." className="min-h-[100px]" {...field} /></FormControl>
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
              Envoyer ma demande de délégation
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    