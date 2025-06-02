
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { DelegationCategory, DelegationItem, DelegationStatus } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  clientName: z.string().min(1, { message: "Nom du client est requis." }),
  taskTitle: z.string().min(1, { message: "Titre de la tâche est requis." }),
  taskDescription: z.string().min(1, { message: "Description de la tâche est requise." }),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type AutreTacheFormValues = z.infer<typeof formSchema>;

interface AutreTacheFormProps {
  onFormSubmitSuccess: () => void;
  onCancel: () => void;
}

export function AutreTacheForm({ onFormSubmitSuccess, onCancel }: AutreTacheFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<AutreTacheFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: '',
      taskTitle: '',
      taskDescription: '',
      dueDate: undefined,
      notes: '',
    },
  });

  async function onSubmit(values: AutreTacheFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);

    try {
      // Initialize with required fields that Zod ensures are present
      const delegationDetails: { [key: string]: any } = {
        taskTitle: values.taskTitle,
        taskDescription: values.taskDescription,
      };

      // Conditionally add dueDate if it's a valid Date object
      if (values.dueDate instanceof Date) {
        delegationDetails.dueDate = values.dueDate;
      }
      
      // Base data object for Firestore, including only guaranteed fields initially
      const delegationDataToSend: { [key: string]: any } = {
        userId: user.uid,
        type: "Tâche Ad Hoc",
        category: "Autres Tâches" as DelegationCategory,
        clientName: values.clientName,
        status: 'En attente' as DelegationStatus,
        details: delegationDetails, // Add the populated details object
        createdDate: serverTimestamp(),
        lastModifiedDate: serverTimestamp(),
      };

      // Conditionally add notes to the top-level object if it's a non-empty string
      if (values.notes && values.notes.trim() !== "") {
        delegationDataToSend.notes = values.notes.trim();
      }
      
      await addDoc(collection(db, 'delegations'), delegationDataToSend);
      toast({ title: 'Tâche Ad Hoc Créée', description: `Tâche "${values.taskTitle}" pour ${values.clientName} enregistrée.` });
      form.reset();
      onFormSubmitSuccess();
    } catch (error: any) {
      console.error("Error saving Ad Hoc Task delegation:", error);
      toast({ variant: 'destructive', title: 'Échec de l\'enregistrement', description: error.message || 'Impossible d\'enregistrer la tâche.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Nouvelle Tâche Ad Hoc</CardTitle>
        <CardDescription>
          Remplissez les détails ci-dessous pour la nouvelle tâche personnalisée. Les champs marqués d&apos;un * sont requis.
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
                  <FormLabel>Nom du client *</FormLabel>
                  <FormControl><Input placeholder="Jean Dupont" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taskTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de la tâche *</FormLabel>
                  <FormControl><Input placeholder="Ex: Préparer dossier XYZ" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taskDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description de la tâche *</FormLabel>
                  <FormControl><Textarea placeholder="Décrivez la tâche en détail..." className="min-h-[100px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date d&apos;échéance (Optionnel)</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                            field.onChange(date);
                            setIsDatePickerOpen(false);
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setDate(new Date().getDate() -1)) 
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire (Optionnel)</FormLabel>
                  <FormControl><Textarea placeholder="Ajoutez des notes supplémentaires si nécessaire..." className="min-h-[100px]" {...field} value={field.value ?? ''} /></FormControl>
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
