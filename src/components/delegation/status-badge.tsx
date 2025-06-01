import { Badge } from "@/components/ui/badge";
import type { DelegationStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: DelegationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors: Record<DelegationStatus, string> = {
    'En attente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'En cours': 'bg-blue-100 text-blue-800 border-blue-300',
    'Terminé': 'bg-green-100 text-green-800 border-green-300',
  };

  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusColors[status])}
    >
      {status}
    </Badge>
  );
}
