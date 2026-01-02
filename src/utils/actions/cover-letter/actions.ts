'use server';

import { LanguageModelV1, streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { initializeAIClient, type AIConfig } from '@/utils/ai-tools';
import { getSubscriptionPlan } from '../stripe/actions';

export async function generate(input: string, config?: AIConfig) {
   try {
      const stream = createStreamableValue('');
      const subscriptionPlan = await getSubscriptionPlan();
      const isPro = subscriptionPlan === 'pro';
      const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

      const system = `
   You are an expert cover letter writer. Write a professional, concise cover letter (max 400 words) for the candidate based strictly on the provided job and resume data.

   # Instructions
   1. **Source Material:** Use ONLY the facts provided in the resume. Do not invent metrics, project names, or achievements.
   2. **Structure:** Create 4 short paragraphs (Intro, Skills, Company Alignment, Closing).
   3. **Tone:** Professional, enthusiastic, and direct.
   4. **Length:** Keep it under 400 words to fit on a single page.

   # Formatting
   - Use HTML format with <p> tags for paragraphs and <br /> tags for line breaks.
   - **Header:** Include the Date, Company Name, and Company Address (if available) at the top.
   - **Signature:** End with "Sincerely," followed by the candidate's Name, Email, Phone, and LinkedIn.
   - **No Placeholders:** Use real data. If a specific detail (like company address) is missing, omit that line.

   Write the letter now.
   `;

      (async () => {
         try {
            console.log('Generating cover letter with config:', JSON.stringify({ model: config?.model, hasApiKey: !!config?.apiKeys?.length }));

            const { textStream } = streamText({
               model: aiClient as LanguageModelV1,
               system,
               prompt: input,
               onFinish: ({ usage }) => {
                  const { promptTokens, completionTokens, totalTokens } = usage;
                  console.log('Usage:', { promptTokens, completionTokens, totalTokens });
               },
            });

            let hasContent = false;
            for await (const delta of textStream) {
               hasContent = true;
               stream.update(delta);
            }

            if (!hasContent) {
               stream.update("<p>Error: The AI model returned an empty response. Please try again or select a different model.</p>");
            }
         } catch (error) {
            console.error('Error in cover letter generation stream:', error);
            stream.update(`\n\n[Error: Failed to generate cover letter. Please check your API key and settings. Details: ${error instanceof Error ? error.message : 'Unknown'}]`);
         } finally {
            stream.done();
         }
      })();

      return { output: stream.value };
   } catch (error) {
      console.error('Error generating cover letter:', error);
      throw error;
   }
}

