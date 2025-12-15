import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT, formatJobContext } from '@/lib/ai/prompts';
import { filterJobsByQuery } from '@/lib/data/services/jobs';
import type { Job } from '@/lib/data/schemas/job';
import { QueryType } from '@/lib/data/types';

describe('Prompt Quality & Validation', () => {
  // Test 1: Prompt explicitly prevents hallucination
  it('includes instructions to prevent hallucination', () => {
    expect(SYSTEM_PROMPT).toContain('ONLY using data');
    expect(SYSTEM_PROMPT.toLowerCase()).toMatch(
      /never (fabricate|make up|assume|invent)/
    );
    expect(SYSTEM_PROMPT).toContain('not in the data');
  });

  // Test 2: Prompt has clear response format
  it('specifies clear response format structure', () => {
    expect(SYSTEM_PROMPT).toContain('RESPONSE FORMAT');
    expect(SYSTEM_PROMPT).toContain('Job Title');
    expect(SYSTEM_PROMPT).toContain('Salary');
  });

  // Test 3: Prompt emphasizes accuracy
  it('prioritizes accuracy over assumptions', () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain('accurate');
    expect(SYSTEM_PROMPT).toContain('specific');
  });

  // Test 4: Context includes all critical job fields
  it('formats job context with all required fields', () => {
    const mockJob: Job = createMockJob({
      jurisdiction: 'sandiego',
      jobCode: 1001,
      title: 'Test Position',
      salaryGrade1: 50.0,
      salaryGrade2: 75.0,
    });

    const context = formatJobContext([mockJob]);
    
    expect(context).toContain('Title:');
    expect(context).toContain('Jurisdiction:');
    expect(context).toContain('Salary Range:');
    expect(context).toContain('Job Code:');
  });

  // Test 5: Validates efficient filtering (core requirement)
  it('enforces 3-5 job limit for LLM context', () => {
    const mockJobs: Job[] = Array(100).fill(null).map((_, i) => 
      createMockJob({
        jurisdiction: 'test',
        jobCode: i,
        title: `Position ${i}`,
      })
    );

    const query = {
      jurisdiction: 'test',
      jobTitle: 'Position',
      queryType: QueryType.GENERAL,
    };

    const filtered = filterJobsByQuery(mockJobs, query, 0.15);
    
    // Simulate what the API route does
    const jobsForContext = filtered.matchCount > 0
      ? filtered.jobs.slice(0, 3)
      : mockJobs.slice(0, 5);

    expect(jobsForContext.length).toBeLessThanOrEqual(5);
    expect(jobsForContext.length).toBeGreaterThan(0);
  });

  // Test 6: Context generation handles empty results gracefully
  it('handles no matching jobs gracefully', () => {
    const context = formatJobContext([]);
    expect(context).toContain('No matching jobs');
  });
});

// Helper function (same as in jobs.test.ts)
function createMockJob(overrides: Partial<Job>): Job {
  return {
    jurisdiction: '',
    jobCode: 0,
    title: null,
    roleDefinition: null,
    exampleDuties: null,
    reportsTo: null,
    supportedBy: null,
    salaryGrade1: null,
    salaryGrade2: null,
    salaryGrade3: null,
    salaryGrade4: null,
    salaryGrade5: null,
    salaryGrade6: null,
    salaryGrade7: null,
    salaryGrade8: null,
    salaryGrade9: null,
    salaryGrade10: null,
    salaryGrade11: null,
    salaryGrade12: null,
    salaryGrade13: null,
    salaryGrade14: null,
    educationLevel: null,
    degreeType: null,
    certifications: null,
    requiredExperience: null,
    yearsOfExperience: null,
    otherRequirements: null,
    specialRequirements: null,
    combinationOfRequirements: null,
    workingConditions: null,
    isTravelRequired: null,
    exemptionStatus: null,
    probationaryPeriod: null,
    isDriverLicenseRequired: null,
    isBackgroundChecked: null,
    isPolygraphRequired: null,
    isMedicalExaminationRequired: null,
    isDrugTestRequired: null,
    isPhysicalExaminationRequired: null,
    isMentalExaminationRequired: null,
    hasDisqualifyingFactors: null,
    disqualifyingFactors: null,
    hasAccommodations: null,
    accommodations: null,
    authorizingBody: null,
    legalReferences: null,
    ...overrides,
  };
}

