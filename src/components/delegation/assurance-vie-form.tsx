
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useController } from 'react-hook-form';
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
import { Loader2, CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { DelegationCategory, DelegationItem, DelegationStatus } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


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
  scheduledPaymentDebitDay: z.enum(["05", "15", "25", "Specific"]).optional(),
  scheduledPaymentSpecificDate: z.date().optional(),
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
  
  const scheduledPaymentAmountValue = Number(data.scheduledPaymentAmount);

  if (scheduledPaymentAmountValue > 0 && !data.scheduledPaymentDebitDay) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date de prélèvement est requise si un versement programmé est saisi.", path: ['scheduledPaymentDebitDay'] });
  }
  if (scheduledPaymentAmountValue > 0 && data.scheduledPaymentDebitDay === "Specific" && !data.scheduledPaymentSpecificDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Veuillez préciser la date spécifique de prélèvement.", path: ['scheduledPaymentSpecificDate'] });
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
      scheduledPaymentSpecificDate: undefined,
      beneficiaryClause: undefined,
      customBeneficiaryClause: '',
      assetAllocationChoice: undefined,
      customAssetAllocation: '',
      notes: '',
    },
  });

  const watchHasCoSubscriber = form.watch('hasCoSubscriber');
  const watchScheduledPaymentAmount = form.watch('scheduledPaymentAmount');
  const watchBeneficiaryClause = form.watch('beneficiaryClause');
  const watchAssetAllocationChoice = form.watch('assetAllocationChoice');
  const watchScheduledPaymentSpecificDate = form.watch('scheduledPaymentSpecificDate');
  const watchScheduledPaymentDebitDay = form.watch('scheduledPaymentDebitDay');


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

      const delegationDetails: { [key: string]: any } = {
        subscriberFirstName: values.subscriberFirstName,
        subscriberLastName: values.subscriberLastName,
        hasCoSubscriber: values.hasCoSubscriber,
        contractName: values.contractName,
        beneficiaryClause: values.beneficiaryClause,
        assetAllocationChoice: values.assetAllocationChoice,
      };

      if (values.hasCoSubscriber) {
        // Zod validation ensures these are non-empty strings if hasCoSubscriber is true
        delegationDetails.coSubscriberFirstName = values.coSubscriberFirstName;
        delegationDetails.coSubscriberLastName = values.coSubscriberLastName;
      }

      if (numericInitialPayment !== undefined) {
        delegationDetails.initialPaymentAmount = numericInitialPayment;
      }
      
      if (numericScheduledPayment !== undefined) { // Can be 0
        delegationDetails.scheduledPaymentAmount = numericScheduledPayment;
        // Only add debit day and specific date if scheduled payment is greater than 0
        if (numericScheduledPayment > 0 && values.scheduledPaymentDebitDay) {
          delegationDetails.scheduledPaymentDebitDay = values.scheduledPaymentDebitDay;
          if (values.scheduledPaymentDebitDay === "Specific" && values.scheduledPaymentSpecificDate) {
            delegationDetails.scheduledPaymentSpecificDate = values.scheduledPaymentSpecificDate;
          }
        }
      }

      if (values.beneficiaryClause === "Clause bénéficiaire libre" && values.customBeneficiaryClause && values.customBeneficiaryClause.trim() !== "") {
        delegationDetails.customBeneficiaryClause = values.customBeneficiaryClause;
      }
      
      if (values.assetAllocationChoice === "Importer une autre allocation d'actifs" && values.customAssetAllocation && values.customAssetAllocation.trim() !== "") {
        delegationDetails.customAssetAllocation = values.customAssetAllocation;
      }

      const delegationData: Omit<DelegationItem, 'id' | 'createdDate'> & { createdDate: any; lastModifiedDate: any; notes?: string } = {
        userId: user.uid,
        type: "Assurance Vie",
        category: "Souscription" as DelegationCategory,
        clientName: clientFullName,
        status: 'En attente' as DelegationStatus,
        details: delegationDetails,
        createdDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(),
      };
      
      if (values.notes && values.notes.trim() !== "") {
        delegationData.notes = values.notes;
      }


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
  
  const { field: scheduledPaymentDebitDayField } = useController({
    name: "scheduledPaymentDebitDay",
    control: form.control,
  });

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
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
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
                  <FormControl><Input type="number" placeholder="Entrer le montant du VI" {...field} value={field.value ?? ''} /></FormControl>
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
                  <FormControl><Input type="number" placeholder="Entrer le montant du VP" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {Number(form.watch('scheduledPaymentAmount')) > 0 && (
               <FormField
                control={form.control}
                name="scheduledPaymentDebitDay"
                render={() => ( 
                  <FormItem className="space-y-3 rounded-md border p-4 shadow-sm">
                    <FormLabel>Date de prélèvement du versement programmé *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          scheduledPaymentDebitDayField.onChange(value); 
                          if (value !== "Specific") {
                            form.setValue('scheduledPaymentSpecificDate', undefined, { shouldValidate: true });
                            setIsDatePickerOpen(false); 
                          } else {
                            // If "Specific" is chosen directly, open date picker
                            setIsDatePickerOpen(true);
                          }
                        }}
                        value={scheduledPaymentDebitDayField.value} 
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="05" id="debitDay05" /></FormControl>
                          <FormLabel htmlFor="debitDay05" className="font-normal">Le 05 du mois</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="15" id="debitDay15" /></FormControl>
                          <FormLabel htmlFor="debitDay15" className="font-normal">Le 15 du mois</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value="25" id="debitDay25" /></FormControl>
                          <FormLabel htmlFor="debitDay25" className="font-normal">Le 25 du mois</FormLabel>
                        </FormItem>
                        
                        <FormItem className="flex items-center space-x-3 space-y-0">
                           <FormControl>
                              <RadioGroupItem value="Specific" id="debitDaySpecificRadio" />
                           </FormControl>
                           <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <Label
                                htmlFor="debitDaySpecificRadio"
                                className={cn(
                                    "font-normal cursor-pointer flex-grow flex items-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground px-3 py-2 text-sm h-10",
                                    scheduledPaymentDebitDayField.value === "Specific" && "bg-accent text-accent-foreground",
                                    scheduledPaymentDebitDayField.value === "Specific" && !watchScheduledPaymentSpecificDate && "text-muted-foreground"
                                )}
                                onClick={() => {
                                    // If not already "Specific", set it and open picker
                                    if (scheduledPaymentDebitDayField.value !== "Specific") {
                                    scheduledPaymentDebitDayField.onChange("Specific");
                                    }
                                    setIsDatePickerOpen(true);
                                }}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduledPaymentDebitDayField.value === "Specific" && watchScheduledPaymentSpecificDate
                                    ? format(watchScheduledPaymentSpecificDate, "PPP")
                                    : "Choisir une autre date"}
                                </Label>
                            </PopoverTrigger>
                            <PopoverContent 
                                className="w-auto p-0" 
                                align="start"
                                onInteractOutside={(e) => {
                                    const target = e.target as HTMLElement;
                                    // Check if the click is on the trigger or inside the popover
                                    if (target.closest('[data-radix-popover-trigger]') || target.closest('[data-radix-popover-content]')) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <Calendar
                                mode="single"
                                selected={watchScheduledPaymentSpecificDate}
                                onSelect={(date) => {
                                    form.setValue('scheduledPaymentSpecificDate', date, { shouldValidate: true });
                                    scheduledPaymentDebitDayField.onChange("Specific"); 
                                    setIsDatePickerOpen(false);
                                }}
                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="beneficiaryClause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clause bénéficiaire *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
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
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
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

