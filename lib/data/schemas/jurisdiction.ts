/**
 * Jurisdiction schema and type definitions.
 */

import { z } from 'zod';

/**
 * Zod schema for jurisdiction data validation
 */
export const JurisdictionSchema = z.object({
  id: z.string(),
  jurisdiction: z.string().describe('Short jurisdiction code (e.g., "sanbernardino", "sdcounty")'),
  name: z.string().describe('User-friendly county name (e.g., "San Bernardino", "San Diego")'),
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

