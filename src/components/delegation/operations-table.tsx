'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from './status-badge';
import { format } from 'date-fns';
import { ArrowUpDown, ListFilter, Search, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { DelegationModal } from './delegation-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

export function OperationsTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [delegations, setDelegations] = useState<DelegationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DelegationStatus[]>([]);
  const [sortBy, setSortBy] = useState<{ key: keyof DelegationItem; direction: 'asc' | 'desc' } | null>(
    { key: 'createdDate', direction: 'desc' }
  );

  const [editingDelegation, setEditingDelegation] = useState<DelegationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingDelegationId, setDeletingDelegationId] = useState<string | null>(null);


  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setDelegations([]);
      return;
    }

    setIsLoading(true);
    // Default server-side sort

    setIsLoading(false);
  }, [user, toast]);

  const handleSort = (key: keyof DelegationItem) => {
    setSortBy((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const filteredAndSortedDelegations = useMemo(() => {
    let items = [...delegations];

    if (searchTerm) {
      items = items.filter(
        (item) =>
          item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter.length > 0) {
      items = items.filter((item) => statusFilter.includes(item.status));
    }

    if (sortBy) {
      items.sort((a, b) => {
        const valA = a[sortBy.key];
        const valB = b[sortBy.key];
        let comparison = 0;
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;
        return sortBy.direction === 'asc' ? comparison : comparison * -1;
      });
    }
    return items;
  }, [delegations, searchTerm, statusFilter, sortBy]);

  const toggleStatusFilter = (status: DelegationStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleEdit = (delegation: DelegationItem) => {
    setEditingDelegation(delegation);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDelegationId) return;
    try {
      // await deleteDoc(doc(db, 'delegations', deletingDelegationId));
      toast({ title: 'Delegation Deleted', description: 'The operation has been deleted.' });
      setDeletingDelegationId(null); // Close dialog
    } catch (error) {
      console.error("Error deleting delegation: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete operation." });
    }
  };

  const renderTableSkeleton = (rows = 5) => (
    Array(rows).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
        <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
      </TableRow>
    ))
  );


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search operations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <ListFilter className="h-3.5 w-3.5" />
              <span className="sm:whitespace-nowrap">Filter Status</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(['En attente', 'En cours', 'Terminé'] as DelegationStatus[]).map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={() => toggleStatusFilter(status)}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {([
                { key: 'type', label: 'Type' },
                { key: 'category', label: 'Category' },
                { key: 'clientName', label: 'Client Name' },
                { key: 'status', label: 'Status' },
                { key: 'createdDate', label: 'Created Date' },
              ] as { key: keyof DelegationItem, label: string }[]).map((col) => (
                <TableHead key={col.key}>
                  <Button variant="ghost" onClick={() => handleSort(col.key)} className="px-1">
                    {col.label}
                    {sortBy?.key === col.key && (
                      <ArrowUpDown className={`ml-2 h-3 w-3 ${sortBy.direction === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                    {sortBy?.key !== col.key && ( <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />)}
                  </Button>
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? renderTableSkeleton() : 
            filteredAndSortedDelegations.length > 0 ? (
              filteredAndSortedDelegations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.clientName}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>{format(new Date(item.createdDate), 'PPp')}</TableCell>
                  <TableCell>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 focus:bg-red-50" 
                            onClick={() => setDeletingDelegationId(item.id)}>
                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No operations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {editingDelegation && (
        <DelegationModal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setEditingDelegation(null);
          }}
          delegationType={editingDelegation.type as DelegationType}
          delegationCategory={editingDelegation.category}
          existingDelegation={editingDelegation}
        />
      )}
       <AlertDialog open={!!deletingDelegationId} onOpenChange={(open) => !open && setDeletingDelegationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the delegation operation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDelegationId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
