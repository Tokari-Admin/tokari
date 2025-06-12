
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

    // Log the entire payload for debugging - REMOVE THIS IN PRODUCTION if sensitive
    console.log('Tally Webhook Payload Received:', JSON.stringify(payload, null, 2));

    const fields = payload.data.fields;

    // Helper function to find a field's value by its label
    const getFieldValueByLabel = (label: string): any | undefined => {
      const field = fields.find(f => f.label === label);
      return field?.value;
    };

    // These labels MUST match the labels of your fields in Tally,
    // especially the hidden fields for User ID and Delegation Type.
    const userId = getFieldValueByLabel('User ID') as string | undefined;
    const delegationType = getFieldValueByLabel('Delegation Type') as DelegationType | undefined;
    const clientName = getFieldValueByLabel('Client Name') as string | undefined;
    const notes = getFieldValueByLabel('Notes') as string | undefined;
    // Example for an optional specific field:
    // const amount = getFieldValueByLabel('Amount');


    if (!userId || !delegationType || !clientName) {
      console.error('Missing required fields from Tally webhook based on expected labels: "User ID", "Delegation Type", or "Client Name"');
      return NextResponse.json(
        { message: 'Webhook received, but missing required fields. Check Tally field labels: "User ID", "Delegation Type", "Client Name".' },
        { status: 400 }
      );
    }

    const category = getCategoryForType(delegationType);
    if (!category) {
      console.error(`Invalid delegationType received or no category mapping: ${delegationType}`);
      return NextResponse.json(
        { message: `Webhook received, but invalid delegationType or no category found: ${delegationType}.` },
        { status: 400 }
      );
    }

    const delegationDetails: { [key: string]: any } = {};
    // Example: Populate 'amount' if an "Amount" field exists and has a value
    // const amountValue = getFieldValueByLabel('Amount');
    // if (amountValue !== undefined && !isNaN(parseFloat(amountValue))) {
    //   delegationDetails.amount = parseFloat(amountValue);
    // }
    // Add other specific details you want to extract from Tally into the details object

    const newDelegation: Omit<DelegationItem, 'id' | 'createdDate'> & { createdDate: any; lastModifiedDate: any } = {
      userId: userId,
      type: delegationType,
      category: category,
      clientName: clientName,
      status: 'En attente' as DelegationStatus, // Default status for new submissions
      notes: notes || '',
      details: delegationDetails, // Populate with any specific details extracted
      createdDate: serverTimestamp(),
      lastModifiedDate: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'delegations'), newDelegation);
    console.log('Delegation created via Tally webhook with ID:', docRef.id);

    return NextResponse.json({ message: 'Webhook processed successfully', delegationId: docRef.id }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing Tally webhook:', error);
    return NextResponse.json({ message: 'Error processing webhook', error: error.message }, { status: 500 });
  }
}
