/**
 * Shared types and enums for the data layer.
 */

import { z } from 'zod';
import { JobSchema } from './schemas/job';

/**
 * Query types that the LLM can extract
 */
export enum QueryType {
  SALARY = 'salary',
  DUTIES = 'duties',
  QUALIFICATIONS = 'qualifications',
  REQUIREMENTS = 'requirements',
  GENERAL = 'general',
}

/**
 * Schema for job query parameters extracted from user message
 */
export const JobQuerySchema = z.object({
  jurisdiction: z.string().optional().describe('The jurisdiction or county name (e.g., "San Diego", "San Bernardino")'),
  jobTitle: z.string().optional().describe('The job title or position name'),
  jobCode: z.number().optional().describe('The numeric job code if mentioned'),
  queryType: z.nativeEnum(QueryType).describe('The type of information being requested'),
});

export type JobQuery = z.infer<typeof JobQuerySchema>;

/**
 * Schema for job search results
 */
export const JobSearchResultSchema = z.object({
  jobs: z.array(JobSchema),
  matchCount: z.number(),
  query: JobQuerySchema,
});

export type JobSearchResult = z.infer<typeof JobSearchResultSchema>;
