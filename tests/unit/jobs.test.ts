import { describe, it, expect } from 'vitest';
import {
  normalizeString,
  calculateSimilarity,
  filterJobsByQuery,
  findJobByExactMatch,
  getUniqueJurisdictions,
} from '@/lib/data/services/jobs';
import type { Job } from '@/lib/data/schemas/job';
import type { JobQuery } from '@/lib/data/types';
import { QueryType } from '@/lib/data/types';

describe('Job Filtering and Search', () => {
  const createMockJob = (overrides: Partial<Job>): Job => ({
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
  });

  const mockJobs: Job[] = [
    createMockJob({
      jurisdiction: 'sandiego',
      jobCode: 1001,
      title: 'Assistant Sheriff',
      roleDefinition: 'Assists with law enforcement',
      exampleDuties: 'Supervise staff, enforce laws',
      salaryGrade1: 70.0,
      salaryGrade2: 100.0,
    }),
    createMockJob({
      jurisdiction: 'sanbernardino',
      jobCode: 1002,
      title: 'Probation Officer',
      roleDefinition: 'Supervises probationers',
      exampleDuties: 'Monitor compliance, write reports',
      salaryGrade1: 50.0,
      salaryGrade2: 75.0,
    }),
    createMockJob({
      jurisdiction: 'sandiego',
      jobCode: 1003,
      title: 'Deputy Sheriff',
      roleDefinition: 'Law enforcement officer',
      exampleDuties: 'Patrol, investigate crimes',
      salaryGrade1: 60.0,
      salaryGrade2: 85.0,
    }),
  ];

  describe('normalizeString', () => {
    it('should convert to lowercase and remove special characters', () => {
      expect(normalizeString('San Diego')).toBe('san diego');
      expect(normalizeString('Assistant-Sheriff')).toBe('assistantsheriff');
      expect(normalizeString('  Test  String  ')).toBe('test string');
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for exact matches', () => {
      expect(calculateSimilarity('test', 'test')).toBe(1.0);
      expect(calculateSimilarity('San Diego', 'San Diego')).toBe(1.0);
    });

    it('should return 0.8 for substring matches', () => {
      expect(calculateSimilarity('test string', 'test')).toBe(0.8);
      expect(calculateSimilarity('assistant', 'assistant sheriff')).toBe(0.8);
    });

    it('should return 0 for no matches', () => {
      expect(calculateSimilarity('apple', 'banana')).toBe(0);
    });

    it('should return proportional score for word overlap', () => {
      const score = calculateSimilarity('assistant sheriff', 'sheriff assistant');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1.0);
    });
  });

  describe('filterJobsByQuery', () => {
    it('should filter by jurisdiction', () => {
      const query: JobQuery = {
        jurisdiction: 'sandiego',
        jobTitle: 'Sheriff',
        queryType: QueryType.GENERAL,
      };

      const result = filterJobsByQuery(mockJobs, query);

      expect(result.matchCount).toBeGreaterThan(0);
      expect(result.jobs.every(j => j.jurisdiction === 'sandiego')).toBe(true);
    });

    it('should filter by job title', () => {
      const query: JobQuery = {
        jobTitle: 'Sheriff',
        queryType: QueryType.GENERAL,
      };

      const result = filterJobsByQuery(mockJobs, query);

      expect(result.matchCount).toBeGreaterThan(0);
      expect(result.jobs.some(j => j.title?.includes('Sheriff'))).toBe(true);
    });

    it('should filter by jurisdiction and title', () => {
      const query: JobQuery = {
        jurisdiction: 'sandiego',
        jobTitle: 'Assistant Sheriff',
        queryType: QueryType.SALARY,
      };

      const result = filterJobsByQuery(mockJobs, query);

      expect(result.matchCount).toBeGreaterThan(0);
      expect(result.jobs[0]?.title).toBe('Assistant Sheriff');
    });

    it('should prioritize exact job code matches', () => {
      const query: JobQuery = {
        jobCode: 1002,
        queryType: QueryType.GENERAL,
      };

      const result = filterJobsByQuery(mockJobs, query);

      expect(result.matchCount).toBeGreaterThan(0);
      expect(result.jobs[0].jobCode).toBe(1002);
    });

    it('should return empty results for non-matching queries', () => {
      const query: JobQuery = {
        jurisdiction: 'Los Angeles',
        queryType: QueryType.GENERAL,
      };

      const result = filterJobsByQuery(mockJobs, query);

      expect(result.matchCount).toBe(0);
      expect(result.jobs).toEqual([]);
    });
  });

  describe('findJobByExactMatch', () => {
    it('should find job by exact jurisdiction and job code', () => {
      const job = findJobByExactMatch(mockJobs, 'sandiego', 1001);

      expect(job).toBeDefined();
      expect(job?.jobCode).toBe(1001);
      expect(job?.jurisdiction).toBe('sandiego');
    });

    it('should handle case-insensitive jurisdiction matching', () => {
      const job = findJobByExactMatch(mockJobs, 'sandiego', 1001);

      expect(job).toBeDefined();
      expect(job?.jobCode).toBe(1001);
    });

    it('should return undefined for non-matching criteria', () => {
      const job = findJobByExactMatch(mockJobs, 'losangeles', 9999);

      expect(job).toBeUndefined();
    });
  });

  describe('getUniqueJurisdictions', () => {
    it('should return unique jurisdictions with proper capitalization', () => {
      const jurisdictions = getUniqueJurisdictions(mockJobs);

      expect(jurisdictions).toContain('Sandiego');
      expect(jurisdictions).toContain('Sanbernardino');
      expect(jurisdictions.length).toBe(2);
    });

    it('should return sorted jurisdictions', () => {
      const jurisdictions = getUniqueJurisdictions(mockJobs);

      const sorted = [...jurisdictions].sort();
      expect(jurisdictions).toEqual(sorted);
    });
  });
});