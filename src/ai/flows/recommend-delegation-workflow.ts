'use server';
/**
 * @fileOverview An AI agent that recommends optimal delegation workflows based on client profiles and financial goals.
 *
 * - recommendDelegationWorkflow - A function that handles the delegation workflow recommendation process.
 * - RecommendDelegationWorkflowInput - The input type for the recommendDelegationWorkflow function.
 * - RecommendDelegationWorkflowOutput - The return type for the recommendDelegationWorkflow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const RecommendDelegationWorkflowInputSchema = z.object({
  clientProfile: z
    .string()
    .describe('A detailed profile of the client, including their financial history, risk tolerance, and investment preferences.'),
  financialGoals: z
    .string()
    .describe('The client’s financial goals, such as retirement planning, wealth accumulation, or estate planning.'),
});

export type RecommendDelegationWorkflowInput = z.infer<
  typeof RecommendDelegationWorkflowInputSchema
>;

const RecommendDelegationWorkflowOutputSchema = z.object({
  workflowRecommendation: z
    .string()
    .describe('A detailed recommendation for the optimal delegation workflow, including specific tasks and strategies.'),
  rationale: z
    .string()
    .describe('A clear explanation of why the recommended workflow is suitable for the client, based on their profile and goals.'),
});

export type RecommendDelegationWorkflowOutput = z.infer<
  typeof RecommendDelegationWorkflowOutputSchema
>;

export async function recommendDelegationWorkflow(
  input: RecommendDelegationWorkflowInput
): Promise<RecommendDelegationWorkflowOutput> {
  return recommendDelegationWorkflowFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendDelegationWorkflowPrompt',
  input: {schema: RecommendDelegationWorkflowInputSchema},
  output: {schema: RecommendDelegationWorkflowOutputSchema},
  prompt: `You are an expert financial advisor specializing in wealth management and delegation strategies.

You will use the provided client profile and financial goals to recommend the most suitable delegation workflow.

Provide a detailed workflow recommendation and a clear rationale for your choice.

Client Profile: {{{clientProfile}}}
Financial Goals: {{{financialGoals}}}
`,
});

const recommendDelegationWorkflowFlow = ai.defineFlow(
  {
    name: 'recommendDelegationWorkflowFlow',
    inputSchema: RecommendDelegationWorkflowInputSchema,
    outputSchema: RecommendDelegationWorkflowOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
