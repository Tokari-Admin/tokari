
import type { Timestamp } from 'firebase/firestore';

export type DelegationStatus = 'En attente' | 'En cours' | 'Terminé';
export type DelegationCategory = 'Souscription' | 'Actes de Gestion';

export interface DelegationItem {
  id: string;
  userId: string; // Wealth manager's Firebase UID
  type: string; // e.g., "Assurance Vie"
  category: DelegationCategory;
  clientName: string;
  status: DelegationStatus;
  createdDate: number; // Store as Firestore Timestamp or epoch milliseconds
  lastModifiedDate?: number;
  notes?: string;
  // Example of specific fields, can be expanded
  details?: {
    amount?: number;
    policyNumber?: string;
    documentUrl?: string;
    [key: string]: any; // For other dynamic fields
  };
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  // Add any other app-specific user fields
  createdAt?: string | Timestamp;
}

export const DelegationSubCategories = {
  Souscription: [
    "Assurance Vie",
    "PER",
    "SCPI Pleine Propriété",
    "SCPI Nue Propriété",
  ],
  "Actes de Gestion": ["Arbitrage"],
} as const;

export type SouscriptionType = typeof DelegationSubCategories.Souscription[number];
export type ActesDeGestionType = typeof DelegationSubCategories['Actes de Gestion'][number];
export type DelegationType = SouscriptionType | ActesDeGestionType;

export function getCategoryForType(type: DelegationType): DelegationCategory | undefined {
  if ((DelegationSubCategories.Souscription as readonly string[]).includes(type)) {
    return 'Souscription';
  }
  if ((DelegationSubCategories['Actes de Gestion'] as readonly string[]).includes(type)) {
    return 'Actes de Gestion';
  }
  return undefined;
}
