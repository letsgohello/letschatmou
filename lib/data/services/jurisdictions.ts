/**
 * Service layer for loading and working with jurisdiction data.
 * Handles data access and mapping for jurisdictions.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { Jurisdiction, JurisdictionSchema } from '../schemas/jurisdiction';

/**
 * Load all jurisdictions from the JSON file.
 * Uses Zod schema to validate data structure.
 */
export async function loadJurisdictions(): Promise<Jurisdiction[]> {
  try {
    const dataPath = join(process.cwd(), 'data', 'gold', 'jurisdictions.json');
    const fileContents = await readFile(dataPath, 'utf-8');
    const rawData = JSON.parse(fileContents);
    
    // Validate using Zod schema
    const jurisdictions = JurisdictionSchema.array().parse(rawData);
    
    return jurisdictions;
  } catch (error) {
    console.error('Error loading jurisdictions:', error);
    throw new Error('Failed to load jurisdiction data');
  }
}

/**
 * Create a mapping from user-friendly names (lowercase) to jurisdiction codes.
 * Also maps the codes to themselves for direct lookups.
 * 
 * Example output:
 * {
 *   "san bernardino" => "sanbernardino",
 *   "san diego" => "sdcounty",
 *   "sanbernardino" => "sanbernardino",
 *   "sdcounty" => "sdcounty"
 * }
 */
export async function getJurisdictionMap(): Promise<Map<string, string>> {
  const jurisdictions = await loadJurisdictions();
  const map = new Map<string, string>();
  
  for (const jurisdiction of jurisdictions) {
    // Map the friendly name (lowercase) to the jurisdiction code
    map.set(jurisdiction.name.toLowerCase(), jurisdiction.jurisdiction);
    
    // Also map the jurisdiction code to itself (for exact matches)
    map.set(jurisdiction.jurisdiction.toLowerCase(), jurisdiction.jurisdiction);
  }
  
  return map;
}

/**
 * Find the jurisdiction code for a user query.
 * Searches for county names mentioned in the query text.
 * 
 * @param query - User's query text
 * @returns The jurisdiction code (e.g., "sanbernardino") or undefined if not found
 */
export async function findJurisdictionInQuery(query: string): Promise<string | undefined> {
  const map = await getJurisdictionMap();
  const lowerQuery = query.toLowerCase();
  
  // Check if any jurisdiction name is mentioned in the query
  for (const [name, code] of map.entries()) {
    if (lowerQuery.includes(name)) {
      return code;
    }
  }
  
  return undefined;
}

/**
 * Get all jurisdiction names (user-friendly format).
 * Useful for validation, suggestions, or displaying available counties.
 */
export async function getAllJurisdictionNames(): Promise<string[]> {
  const jurisdictions = await loadJurisdictions();
  return jurisdictions.map(j => j.name);
}

/**
 * Get jurisdiction by code.
 * Returns the full jurisdiction object for a given code.
 */
export async function getJurisdictionByCode(code: string): Promise<Jurisdiction | undefined> {
  const jurisdictions = await loadJurisdictions();
  return jurisdictions.find(j => 
    j.jurisdiction.toLowerCase() === code.toLowerCase()
  );
}

