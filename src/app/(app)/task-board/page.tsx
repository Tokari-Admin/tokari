
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DelegationItem, DelegationStatus } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { TaskColumn } from '@/components/task-board/task-column';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AutreTacheForm } from '@/components/delegation/autre-tache-form';
import { PlusCircle, ChevronLeft } from 'lucide-react';

const STATUS_COLUMNS: DelegationStatus[] = ['En attente', 'En cours', 'Terminé'];

export default function TaskBoardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [delegations, setDelegations] = useState<DelegationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setDelegations([]);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, 'delegations'),
      where('userId', '==', user.uid)
      // We will sort client-side for this board view by createdDate later
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: DelegationItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          createdDate: data.createdDate?.toMillis ? data.createdDate.toMillis() : (data.createdDate || 0),
          lastModifiedDate: data.lastModifiedDate?.toMillis ? data.lastModifiedDate.toMillis() : (data.lastModifiedDate || 0),
        } as DelegationItem);
      });
      setDelegations(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching delegations for board: ", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les tâches." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<DelegationStatus, DelegationItem[]> = {
      'En attente': [],
      'En cours': [],
      'Terminé': [],
    };
    delegations.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // Handle tasks that might have an unexpected status, group them in 'En attente' or log.
        if (!grouped[task.status]) grouped[task.status] = [];
        grouped[task.status].push(task);
      }
    });

    // Sort tasks within each column by createdDate (descending, newest first)
    for (const statusKey in grouped) {
      const s = statusKey as DelegationStatus;
      if (grouped[s]) {
        grouped[s].sort((a, b) => b.createdDate - a.createdDate);
      }
    }
    return grouped;
  }, [delegations]);

  const handleCreateTaskSuccess = () => {
    setShowCreateTaskForm(false);
    // toast({ title: "Tâche créée", description: "La nouvelle tâche a été ajoutée au tableau." });
  };

  const handleCancelCreateTask = () => {
    setShowCreateTaskForm(false);
  };

  const renderSkeletonColumns = (count = 3) => (
    Array(count).fill(0).map((_, index) => (
      <div key={`skeleton-col-${index}`} className="w-80 flex-shrink-0">
        <Skeleton className="h-12 w-full mb-2" />
        <div className="space-y-3 p-3 bg-muted/30 rounded-md min-h-[200px]">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    ))
  );

  if (showCreateTaskForm) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0">
        <Button
          variant="outline"
          onClick={handleCancelCreateTask}
          className="mb-6 flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Retour au tableau
        </Button>
        <AutreTacheForm
          onFormSubmitSuccess={handleCreateTaskSuccess}
          onCancel={handleCancelCreateTask}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold text-foreground">
            Tableau de Tâches (Kanban)
          </h1>
          <p className="text-muted-foreground">
            Visualisez vos opérations déléguées par statut.
          </p>
        </div>
        <Button onClick={() => setShowCreateTaskForm(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          Créer une Tâche
        </Button>
      </header>
      
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto p-1 pb-4">
          {renderSkeletonColumns()}
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto p-1 pb-4">
          {STATUS_COLUMNS.map(status => (
            <TaskColumn
              key={status}
              title={status}
              tasks={tasksByStatus[status] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
