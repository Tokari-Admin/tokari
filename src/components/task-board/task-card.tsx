
'use client';

import type { DelegationItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale'; // For French date formatting
import { Briefcase, User, Info, CalendarDays } from 'lucide-react';

export function TaskCard({ task }: { task: DelegationItem }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Souscription':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Actes de Gestion':
        return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'Autres Tâches':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
  
  const getDueDateInfo = () => {
    if (task.details?.dueDate) {
      const dueDate = new Date(task.details.dueDate);
      const now = new Date();
      const isPast = dueDate < now && !isSameDay(dueDate, now);
      const distance = formatDistanceToNow(dueDate, { addSuffix: true, locale: fr });
      return {
        text: `Échéance ${distance}`,
        colorClass: isPast ? 'text-red-500' : 'text-muted-foreground',
      };
    }
    return null;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <Card className="bg-card shadow-sm hover:shadow-lg transition-shadow duration-150 ease-in-out cursor-grab">
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold leading-tight flex items-center gap-2">
             <Briefcase className="h-4 w-4 text-primary/80 shrink-0" />
            {task.type}
          </CardTitle>
          <Badge variant="outline" className={`text-xs font-normal ${getCategoryColor(task.category)}`}>
            {task.category}
          </Badge>
        </div>
         <CardDescription className="text-xs pt-1 flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground shrink-0" /> {task.clientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-1 text-sm space-y-2">
        {task.notes && (
          <p className="text-xs line-clamp-3 text-muted-foreground flex items-start gap-2">
            <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            <span>{task.notes}</span>
          </p>
        )}
         {task.details?.taskTitle && task.category === "Autres Tâches" && (
          <p className="text-xs font-medium text-foreground flex items-start gap-2">
            <span>Titre: {task.details.taskTitle}</span>
          </p>
        )}
         {task.details?.taskDescription && task.category === "Autres Tâches" && (
          <p className="text-xs line-clamp-3 text-muted-foreground flex items-start gap-2">
            <span>{task.details.taskDescription}</span>
          </p>
        )}

        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatDistanceToNow(new Date(task.createdDate), { addSuffix: true, locale: fr })}
          </span>
          {dueDateInfo && (
             <span className={`flex items-center gap-1 ${dueDateInfo.colorClass}`}>
              <CalendarDays className="h-3 w-3 shrink-0" />
              {dueDateInfo.text}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
