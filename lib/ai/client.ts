/**
 * Google Gemini client configuration using official Google Generative AI SDK.
 * Handles authentication and model setup.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Validate that required AI configuration is present
 */
export function validateAIConfig(): void {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required. ' +
      'Please add it to your .env.local file.'
    );
  }
}

/**
 * Create Google Generative AI client instance
 */
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Default model to use for chat completions.
 */
export const MODEL_NAME = 'gemini-2.5-flash-lite';
