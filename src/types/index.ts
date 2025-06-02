
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

    // Fields for Autre Tache form
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
  "Autres Tâches": [], // Empty array, will be handled specially in UI to open a native form
} as const;

export type SouscriptionType = typeof DelegationSubCategories.Souscription[number];
export type ActesDeGestionType = typeof DelegationSubCategories['Actes de Gestion'][number];
// For "Autres Tâches", the type will be a fixed string like "Tâche Ad Hoc" defined in the form logic.
export type DelegationType = SouscriptionType | ActesDeGestionType | "Tâche Ad Hoc";


export function getCategoryForType(type: DelegationType): DelegationCategory | undefined {
  if ((DelegationSubCategories.Souscription as readonly string[]).includes(type)) {
    return 'Souscription';
  }
  if ((DelegationSubCategories['Actes de Gestion'] as readonly string[]).includes(type)) {
    return 'Actes de Gestion';
  }
  if (type === "Tâche Ad Hoc") { // Explicitly check for the ad-hoc task type
    return 'Autres Tâches';
  }
  return undefined;
}
