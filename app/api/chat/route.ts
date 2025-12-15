/**
 * Chat API route using Google Generative AI SDK for streaming responses.
 * Handles job filtering and context injection.
 */

import { genAI, MODEL_NAME, validateAIConfig } from '@/lib/ai/client';
import { SYSTEM_PROMPT, formatJobContext } from '@/lib/ai/prompts';
import { loadJobs, filterJobsByQuery } from '@/lib/data/jobs';
import { QueryType } from '@/lib/data/types';

// Use Node.js runtime to support file system access
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST handler for chat completions using Google Generative AI SDK
 */
export async function POST(req: Request) {
  try {
    // Validate AI configuration
    validateAIConfig();

    // Parse request body
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array required', {
        status: 400,
      });
    }

    // Load all jobs
    const allJobs = await loadJobs();
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';

    // Instead of complex filtering, provide a good sample of jobs
    // If user mentions specific county or job, try to filter, otherwise give diverse sample
    const lowerQuery = userQuery.toLowerCase();
    
    let jobsToInclude = allJobs;
    
    // If they mention a specific county, filter to that county
    const counties = ['san diego', 'san bernardino', 'los angeles', 'orange', 
                     'riverside', 'san francisco', 'sacramento', 'alameda'];
    const foundCounty = counties.find(county => lowerQuery.includes(county));
    
    if (foundCounty) {
      jobsToInclude = allJobs.filter(job => 
        job.jurisdiction.toLowerCase().includes(foundCounty)
      );
    }
    
    // Try fuzzy matching if they mention job keywords
    const query = {
      queryType: QueryType.GENERAL,
      jurisdiction: foundCounty,
      jobTitle: userQuery,
    };
    
    const fuzzyMatches = filterJobsByQuery(jobsToInclude, query, 0.15);
    
    // Provide either fuzzy matches or a diverse sample
    const jobsForContext = fuzzyMatches.matchCount > 0
      ? fuzzyMatches.jobs.slice(0, 25) // More jobs for better context
      : jobsToInclude.slice(0, 50); // Or provide first 50 jobs as sample
    
    const context = formatJobContext(jobsForContext);

    // Create the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Build the prompt with ALL conversation history and context
    const conversationHistory = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n\n');

    // Build the prompt with context
    const fullPrompt = `${SYSTEM_PROMPT}

Available Job Data (${jobsForContext.length} positions):
${context}

Conversation History:
${conversationHistory}

Instructions: Answer the user's most recent question using the job data provided above. Be specific and reference actual job titles, salaries, and requirements from the data.`;

    // Generate streaming response
    const result = await model.generateContentStream(fullPrompt);

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            // Format as AI SDK compatible stream (using data protocol)
            const data = `0:"${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Return user-friendly error message
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
