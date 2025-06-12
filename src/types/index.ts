
import type { Timestamp } from 'firebase/firestore';

export type DelegationStatus = 'En attente' | 'En cours' | 'Terminé';
export type DelegationCategory = 'Souscription' | 'Actes de Gestion' | 'Autres Tâches';

export interface DelegationItem {
  id: string;
  userId: string; // Wealth manager's Firebase UID
  type: string; // e.g., "Assurance Vie", "Tâche Ad Hoc"
  category: DelegationCategory;
  clientName: string; // Primary subscriber's full name or client for ad-hoc task
  status: DelegationStatus;
  createdDate: number; // Store as Firestore Timestamp or epoch milliseconds
  lastModifiedDate?: number;
  notes?: string; // General comments from the form
  details?: {
    // Fields for native Assurance Vie form
    subscriberFirstName?: string;
    subscriberLastName?: string;
    hasCoSubscriber?: boolean;
    coSubscriberFirstName?: string;
    coSubscriberLastName?: string;
    contractName?: "Cristalliance Avenir - VIE PLUS" | "Cristalliance Evoluvie - APICIL" | "Fipavie Neo - ODDO";
    initialPaymentAmount?: number;
    scheduledPaymentAmount?: number;
    scheduledPaymentDebitDay?: "05" | "15" | "25" | "Specific";
    scheduledPaymentSpecificDate?: Date;
    beneficiaryClause?: "Clause bénéficiaire générale" | "Clause bénéficiaire libre";
    customBeneficiaryClause?: string;
    assetAllocationChoice?: "Utiliser l'allocation d'actifs que j'ai déjà importé" | "Importer une autre allocation d'actifs";
    customAssetAllocation?: string;

    // Fields for Autre Tache form (now handled by Tally, but structure kept for webhook data)
    taskTitle?: string;
    taskDescription?: string;
    dueDate?: Date; // Stored as Date, Firestore converts to Timestamp

    // Original generic fields - can be reused or deprecated based on specific form needs
    amount?: number;
    policyNumber?: string;
    documentUrl?: string;
    productType?: string;
    riskProfile?: string;
    [key: string]: any;
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
  "Autres Tâches": ["Tâche Ad Hoc"], // Updated to include "Tâche Ad Hoc"
} as const;

export type SouscriptionType = typeof DelegationSubCategories.Souscription[number];
export type ActesDeGestionType = typeof DelegationSubCategories['Actes de Gestion'][number];
export type AutresTachesType = typeof DelegationSubCategories['Autres Tâches'][number]; // Added this type

export type DelegationType = SouscriptionType | ActesDeGestionType | AutresTachesType;


export function getCategoryForType(type: DelegationType): DelegationCategory | undefined {
  if ((DelegationSubCategories.Souscription as readonly string[]).includes(type)) {
    return 'Souscription';
  }
  if ((DelegationSubCategories['Actes de Gestion'] as readonly string[]).includes(type)) {
    return 'Actes de Gestion';
  }
  if ((DelegationSubCategories['Autres Tâches'] as readonly string[]).includes(type)) { // Updated to check the array
    return 'Autres Tâches';
  }
  return undefined;
}

