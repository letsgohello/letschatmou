/**
 * Type definitions and Zod schemas for job data.
 * 
 * Schema defined in snake_case to match JSON structure,
 * then transformed to camelCase for TypeScript consumption.
 */

import { z } from 'zod';
import { camelCase, mapKeys } from 'lodash';

/**
 * Utility type to convert snake_case to camelCase at the type level.
 * Examples:
 *   snake_case → snakeCase
 *   salary_grade_1 → salaryGrade1
 *   is_travel_required → isTravelRequired
 */
type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

/**
 * Utility type to convert all keys in an object from snake_case to camelCase.
 * Preserves the value types while transforming the keys.
 */
type CamelCaseKeys<T> = {
  [K in keyof T as SnakeToCamel<K & string>]: T[K];
};

/**
 * Job schema with automatic snake_case → camelCase transformation.
 * 
 * Schema is defined in snake_case to match JSON structure,
 * then transformed to camelCase for TypeScript consumption.
 * 
 * Access types via:
 * - JobSchema._input  → snake_case type
 * - JobSchema._output → camelCase type (or use Job type alias)
 */
export const JobSchema = z.object({
  // Required fields
  jurisdiction: z.string(),
  job_code: z.number(),
  
  // Optional text fields
  title: z.string().nullable(),
  role_definition: z.string().nullable(),
  example_duties: z.string().nullable(),
  reports_to: z.string().nullable(),
  supported_by: z.string().nullable(),
  
  // Salary grades (14 levels)
  salary_grade_1: z.number().nullable(),
  salary_grade_2: z.number().nullable(),
  salary_grade_3: z.number().nullable(),
  salary_grade_4: z.number().nullable(),
  salary_grade_5: z.number().nullable(),
  salary_grade_6: z.number().nullable(),
  salary_grade_7: z.number().nullable(),
  salary_grade_8: z.number().nullable(),
  salary_grade_9: z.number().nullable(),
  salary_grade_10: z.number().nullable(),
  salary_grade_11: z.number().nullable(),
  salary_grade_12: z.number().nullable(),
  salary_grade_13: z.number().nullable(),
  salary_grade_14: z.number().nullable(),
  
  // Education and experience
  education_level: z.string().nullable(),
  degree_type: z.string().nullable(),
  certifications: z.string().nullable(),
  required_experience: z.string().nullable(),
  years_of_experience: z.union([z.string(), z.number()]).nullable().transform(val => 
    val === null ? null : String(val)
  ),
  other_requirements: z.string().nullable(),
  special_requirements: z.string().nullable(),
  combination_of_requirements: z.string().nullable(),
  
  // Employment conditions
  working_conditions: z.string().nullable(),
  is_travel_required: z.boolean().nullable(),
  exemption_status: z.string().nullable(),
  probationary_period: z.string().nullable(),
  
  // Requirements and checks
  is_driver_license_required: z.boolean().nullable(),
  is_background_checked: z.boolean().nullable(),
  is_polygraph_required: z.boolean().nullable(),
  is_medical_examination_required: z.boolean().nullable(),
  is_drug_test_required: z.boolean().nullable(),
  is_physical_examination_required: z.boolean().nullable(),
  is_mental_examination_required: z.boolean().nullable(),
  
  // Disqualifications and accommodations
  has_disqualifying_factors: z.boolean().nullable(),
  disqualifying_factors: z.string().nullable(),
  has_accommodations: z.boolean().nullable(),
  accommodations: z.string().nullable(),
  
  // Legal
  authorizing_body: z.string().nullable(),
  legal_references: z.string().nullable(),
}).transform((data) => {
  // Transform all snake_case keys to camelCase using lodash mapKeys
  // TypeScript utility type CamelCaseKeys ensures type safety
  return mapKeys(data, (_value, key) => camelCase(key)) as CamelCaseKeys<typeof data>;
});


/**
 * Job type - the output of JobSchema (camelCase keys).
 * TypeScript automatically infers all camelCase field names!
 */
export type Job = z.infer<typeof JobSchema>;

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
  queryType: z.enum(QueryType).describe('The type of information being requested'),
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

/**
 * Helper function to get salary range from a job
 */
export function getSalaryRange(job: Job): { min: number | null; max: number | null } {
  const salaryGrades: number[] = [];
  for (let i = 1; i <= 14; i++) {
    const grade = job[`salaryGrade${i}` as keyof Job];
    if (typeof grade === 'number' && grade !== null) {
      salaryGrades.push(grade);
    }
  }

  if (salaryGrades.length === 0) {
    return { min: null, max: null };
  }

  return {
    min: Math.min(...salaryGrades),
    max: Math.max(...salaryGrades),
  };
}

/**
 * Helper function to check if a job has salary information
 */
export function hasSalaryInfo(job: Job): boolean {
  const { min, max } = getSalaryRange(job);
  return min !== null && max !== null;
}

/**
 * Helper function to get a human-readable job identifier
 */
export function getJobIdentifier(job: Job): string {
  const title = job.title || 'Unknown Position';
  const jurisdiction = job.jurisdiction.charAt(0).toUpperCase() + job.jurisdiction.slice(1);
  return `${title} in ${jurisdiction}`;
}
