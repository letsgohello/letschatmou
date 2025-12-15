/**
 * Chat API route using Google Generative AI SDK for streaming responses.
 * Handles job filtering and context injection.
 */

import { genAI, MODEL_NAME, validateAIConfig } from '@/lib/ai/client';
import { SYSTEM_PROMPT, formatJobContext } from '@/lib/ai/prompts';
import { loadJobs, filterJobsByQuery } from '@/lib/data/services/jobs';
import { QueryType } from '@/lib/data/types';
import { findJurisdictionInQuery } from '@/lib/data/services/jurisdictions';

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

    let jobsToInclude = allJobs;
    
    // Use jurisdiction mapping to find the exact jurisdiction code
    const jurisdictionCode = await findJurisdictionInQuery(userQuery);
    
    if (jurisdictionCode) {
      // Filter to exact jurisdiction match
      jobsToInclude = allJobs.filter(job => 
        job.jurisdiction.toLowerCase() === jurisdictionCode.toLowerCase()
      );
    }
    
    // Try fuzzy matching if they mention job keywords
    const query = {
      queryType: QueryType.GENERAL,
      jurisdiction: jurisdictionCode,
      jobTitle: userQuery,
    };
    
    const fuzzyMatches = filterJobsByQuery(jobsToInclude, query, 0.15);

    // Send only top 3-5 most relevant jobs to optimize token usage and accuracy
    const jobsForContext = fuzzyMatches.matchCount > 0
      ? fuzzyMatches.jobs.slice(0, 3)  // Top 3 most relevant matches
      : jobsToInclude.slice(0, 5);      // Or 5 sample jobs if no specific match
    
    const context = formatJobContext(jobsForContext);

    // Create the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Build structured prompt with clear sections
    const conversationHistory = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
    ).join('\n\n');

    // Assemble the full prompt with clear structure
    const fullPrompt = `${SYSTEM_PROMPT}

===== AVAILABLE JOB POSITIONS =====
You have access to ${jobsForContext.length} relevant position(s) that match the user's query:

${context}

===== CONVERSATION HISTORY =====
${conversationHistory}

===== CURRENT USER QUESTION =====
${userQuery}

===== YOUR TASK =====
Provide a specific, accurate answer to the current user question using ONLY the job data provided above. Reference actual job titles, jurisdictions, salary ranges, and requirements from the available positions.`;

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
