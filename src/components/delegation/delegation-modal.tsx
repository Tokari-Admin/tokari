'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { DelegationCategory, DelegationItem, DelegationStatus, DelegationType } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Timestamp, addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  clientName: z.string().min(2, { message: "Client name is required." }),
  notes: z.string().optional(),
  status: z.enum(['En attente', 'En cours', 'Terminé']).default('En attente'),
  // Add more fields as needed, e.g., amount, policy details
  amount: z.number().optional(),
});

interface DelegationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  delegationType: DelegationType;
  delegationCategory: DelegationCategory;
  existingDelegation?: DelegationItem | null;
  onSuccess?: () => void;
}

export function DelegationModal({
  isOpen,
  onOpenChange,
  delegationType,
  delegationCategory,
  existingDelegation,
  onSuccess,
}: DelegationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: existingDelegation
      ? {
          clientName: existingDelegation.clientName,
          notes: existingDelegation.notes || '',
          status: existingDelegation.status,
          amount: existingDelegation.details?.amount,
        }
      : {
          clientName: '',
          notes: '',
          status: 'En attente',
          amount: undefined,
        },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);

    try {
      const delegationData: Omit<DelegationItem, 'id' | 'createdDate'> & { createdDate?: any, lastModifiedDate?: any } = {
        userId: user.uid,
        type: delegationType,
        category: delegationCategory,
        clientName: values.clientName,
        status: values.status as DelegationStatus,
        notes: values.notes,
        details: {
          amount: values.amount,
        },
        lastModifiedDate: serverTimestamp(),
      };

      if (existingDelegation) {
        const delegationRef = doc(db, 'delegations', existingDelegation.id);
        await updateDoc(delegationRef, delegationData);
        toast({ title: 'Delegation Updated', description: `${delegationType} for ${values.clientName} updated successfully.` });
      } else {
        delegationData.createdDate = serverTimestamp();
        await addDoc(collection(db, 'delegations'), delegationData);
        toast({ title: 'Delegation Created', description: `${delegationType} for ${values.clientName} created successfully.` });
      }
      onOpenChange(false);
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error saving delegation:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save delegation.' });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Reset form when modal opens with new data or closes
  useState(() => {
    if (isOpen) {
      form.reset(existingDelegation
      ? {
          clientName: existingDelegation.clientName,
          notes: existingDelegation.notes || '',
          status: existingDelegation.status,
          amount: existingDelegation.details?.amount,
        }
      : {
          clientName: '',
          notes: '',
          status: 'En attente',
          amount: undefined,
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingDelegation]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {existingDelegation ? 'Edit' : 'New'} Delegation: {delegationType}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for this {delegationCategory.toLowerCase()} task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Example additional field */}
            { (delegationType === "Assurance Vie" || delegationType === "Arbitrage" || delegationType === "PER" || delegationType.startsWith("SCPI")) && (
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Amount (€)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 10000" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            )}


            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="Terminé">Terminé</SelectItem>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any relevant notes for this delegation..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingDelegation ? 'Save Changes' : 'Create Delegation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
