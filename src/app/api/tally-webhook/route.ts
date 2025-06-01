
import { NextResponse, type NextRequest } from 'next/server';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategoryForType } from '@/types/index';
import type { DelegationItem, DelegationStatus, DelegationType, DelegationCategory } from '@/types/index';

// Define a type for the expected structure of a field from Tally
interface TallyField {
  key: string;
  label: string;
  value: any;
  type: string;
}

// Define a type for the expected Tally webhook payload structure
interface TallyWebhookPayload {
  eventId: string;
  eventCreatedAt: string;
  formId: string;
  responseId: string;
  data: {
    responseId: string;
    submissionId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: TallyField[];
    // Add other properties from Tally payload if needed, like metadata or respondent
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as TallyWebhookPayload;

    // Log the entire payload for debugging - REMOVE THIS IN PRODUCTION
    console.log('Tally Webhook Payload Received:', JSON.stringify(payload, null, 2));

    const fields = payload.data.fields;

    // Helper function to find a field's value by its label
    const getFieldValueByLabel = (label: string): any | undefined => {
      const field = fields.find(f => f.label === label);
      return field?.value;
    };

    const userId = getFieldValueByLabel('User ID') as string | undefined;
    const delegationType = getFieldValueByLabel('Delegation Type') as DelegationType | undefined;
    const clientName = getFieldValueByLabel('Client Name') as string | undefined; // Assuming 'Client Name' is the label in Tally
    const notes = getFieldValueByLabel('Notes') as string | undefined; // Assuming 'Notes' is a label in Tally

    if (!userId || !delegationType || !clientName) {
      console.error('Missing required fields from Tally webhook: userId, delegationType, or clientName');
      return NextResponse.json(
        { message: 'Webhook received, but missing required fields: userId, delegationType, or clientName.' },
        { status: 400 }
      );
    }

    const category = getCategoryForType(delegationType);
    if (!category) {
      console.error(`Invalid delegationType received: ${delegationType}`);
      return NextResponse.json(
        { message: `Webhook received, but invalid delegationType: ${delegationType}.` },
        { status: 400 }
      );
    }

    const newDelegation: Omit<DelegationItem, 'id' | 'createdDate'> & { createdDate: any; lastModifiedDate: any } = {
      userId: userId,
      type: delegationType,
      category: category,
      clientName: clientName,
      status: 'En attente' as DelegationStatus, // Default status
      notes: notes || '',
      details: {
        // You might want to extract more specific details from Tally if available
        // For example, if there's an 'Amount' field:
        // amount: parseFloat(getFieldValueByLabel('Amount')) || undefined,
      },
      createdDate: serverTimestamp(),
      lastModifiedDate: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'delegations'), newDelegation);
    console.log('Delegation created with ID:', docRef.id);

    return NextResponse.json({ message: 'Webhook processed successfully', delegationId: docRef.id }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing Tally webhook:', error);
    return NextResponse.json({ message: 'Error processing webhook', error: error.message }, { status: 500 });
  }
}

// Optional: Basic security check (e.g., a simple secret key)
// For production, you should implement more robust webhook signature verification if Tally supports it.
// const TALLY_WEBHOOK_SECRET = process.env.TALLY_WEBHOOK_SECRET;
// if (TALLY_WEBHOOK_SECRET && request.headers.get('X-Tally-Signature') !== TALLY_WEBHOOK_SECRET) {
//   return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
// }
