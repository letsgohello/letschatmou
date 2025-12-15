/**
 * Service layer for loading and filtering job data.
 * Handles data access and business logic for jobs.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { Job, JobSchema } from '../schemas/job';
import type { JobQuery, JobSearchResult } from '../types';

/**
 * Load all jobs from the JSON file.
 * Uses Zod schema to validate and transform from snake_case to camelCase.
 */
export async function loadJobs(): Promise<Job[]> {
  try {
    const dataPath = join(process.cwd(), 'data', 'gold', 'jobs.json');
    const fileContents = await readFile(dataPath, 'utf-8');
    const rawData = JSON.parse(fileContents);
    
    // Validate and transform using Zod schema
    const jobs = JobSchema.array().parse(rawData);
    
    return jobs;
  } catch (error) {
    console.error('Error loading jobs:', error);
    throw new Error('Failed to load job data');
  }
}

/**
 * Normalize a string for comparison:
 * - Convert to lowercase
 * - Remove special characters
 * - Trim whitespace
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity score between two strings (0-1 range).
 * - Exact match: 1.0
 * - One contains the other: 0.8
 * - Word overlap: proportional score
 * - No match: 0
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  // Exact match
  if (norm1 === norm2) {
    return 1.0;
  }
  
  // One string contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.8;
  }
  
  // Calculate word overlap
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  const matchingWords = words1.filter(word => 
    words2.some(w2 => w2.includes(word) || word.includes(w2))
  );
  
  if (matchingWords.length === 0) {
    return 0;
  }
  
  // Proportional score based on overlap
  const overlapRatio = matchingWords.length / Math.max(words1.length, words2.length);
  return overlapRatio * 0.7; // Max 0.7 for partial word matches
}

/**
 * Calculate a weighted match score for a job against a query.
 * Prioritizes title field, then searches role definition and example duties.
 */
function calculateJobMatchScore(job: Job, query: JobQuery): number {
  const { jobTitle, jurisdiction, jobCode } = query;
  
  let score = 0;
  
  // Exact job code match is highest priority
  if (jobCode !== undefined && job.jobCode === jobCode) {
    score += 10; // Guaranteed match
  }
  
  // Jurisdiction match (required if specified)
  if (jurisdiction) {
    const jurisdictionScore = calculateSimilarity(
      job.jurisdiction,
      jurisdiction
    );
    
    if (jurisdictionScore < 0.5) {
      return 0; // Exclude if jurisdiction doesn't match well
    }
    
    score += jurisdictionScore;
  }
  
  // Job title matching with weighted fields
  if (jobTitle) {
    // Title field gets 1.5x weight
    if (job.title) {
      const titleScore = calculateSimilarity(job.title, jobTitle);
      score += titleScore * 1.5;
    }
    
    // Role definition gets 1.0x weight
    if (job.roleDefinition) {
      const roleScore = calculateSimilarity(job.roleDefinition, jobTitle);
      score += roleScore;
    }
    
    // Example duties get 0.8x weight
    if (job.exampleDuties) {
      const dutiesScore = calculateSimilarity(job.exampleDuties, jobTitle);
      score += dutiesScore * 0.8;
    }
  }
  
  return score;
}

/**
 * Filter jobs based on query parameters with fuzzy matching.
 * Returns jobs that meet the similarity threshold, sorted by relevance.
 */
export function filterJobsByQuery(
  jobs: Job[],
  query: JobQuery,
  threshold: number = 0.5
): JobSearchResult {
  // Score all jobs
  const scoredJobs = jobs.map(job => ({
    job,
    score: calculateJobMatchScore(job, query),
  }));
  
  // Filter by threshold and sort by score (descending)
  const matchedJobs = scoredJobs
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ job }) => job);
  
  return {
    jobs: matchedJobs,
    matchCount: matchedJobs.length,
    query,
  };
}

/**
 * Find a job by exact jurisdiction and job code match.
 * Useful when the user provides specific identifiers.
 */
export function findJobByExactMatch(
  jobs: Job[],
  jurisdiction: string,
  jobCode: number
): Job | undefined {
  const normalizedJurisdiction = normalizeString(jurisdiction);
  
  return jobs.find(
    job =>
      normalizeString(job.jurisdiction) === normalizedJurisdiction &&
      job.jobCode === jobCode
  );
}

/**
 * Get list of unique jurisdictions from all jobs.
 * Useful for suggestions or validation.
 */
export function getUniqueJurisdictions(jobs: Job[]): string[] {
  const jurisdictions = new Set<string>();
  
  jobs.forEach(job => {
    const normalized = job.jurisdiction.charAt(0).toUpperCase() + 
                      job.jurisdiction.slice(1).toLowerCase();
    jurisdictions.add(normalized);
  });
  
  return Array.from(jurisdictions).sort();
}

/**
 * Get count of jobs by jurisdiction.
 * Useful for analytics or debugging.
 */
export function getJobCountsByJurisdiction(jobs: Job[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  jobs.forEach(job => {
    const jurisdiction = job.jurisdiction;
    counts[jurisdiction] = (counts[jurisdiction] || 0) + 1;
  });
  
  return counts;
}
