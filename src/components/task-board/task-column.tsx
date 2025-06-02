
'use client';

import type { DelegationItem, DelegationStatus } from '@/types';
import { TaskCard } from './task-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskColumnProps {
  title: DelegationStatus;
  tasks: DelegationItem[];
}

export function TaskColumn({ title, tasks }: TaskColumnProps) {
  let titleColorClass = '';
  switch (title) {
    case 'En attente':
      titleColorClass = 'text-yellow-600 border-yellow-500';
      break;
    case 'En cours':
      titleColorClass = 'text-blue-600 border-blue-500';
      break;
    case 'Terminé':
      titleColorClass = 'text-green-600 border-green-500';
      break;
    default:
      titleColorClass = 'text-foreground border-border';
  }

  return (
    <div className="w-80 md:w-96 flex-shrink-0 flex flex-col max-h-full">
      <Card className="flex flex-col flex-1 overflow-hidden shadow-md">
        <CardHeader className={`p-4 border-b ${titleColorClass}`}>
          <CardTitle className="font-headline text-lg">{title}</CardTitle>
          <CardDescription className="text-xs">
            {tasks.length} {tasks.length === 1 ? 'tâche' : 'tâches'}
          </CardDescription>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="p-3 space-y-3 bg-muted/20 min-h-[100px] h-full">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center italic">
                Aucune tâche ici.
              </p>
            ) : (
              tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
