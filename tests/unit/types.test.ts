import { describe, it, expect } from 'vitest';
import { JobSchema, getSalaryRange, hasSalaryInfo, getJobIdentifier } from '@/lib/data/schemas/job';
import { QueryType } from '@/lib/data/types';

describe('Job Type System', () => {
  describe('JobSchema', () => {
    it('should transform snake_case to camelCase', () => {
      const rawJob = {
        jurisdiction: 'sandiego',
        job_code: 1234,
        title: 'Test Position',
        role_definition: 'Test role',
        example_duties: 'Test duties',
        reports_to: 'Manager',
        supported_by: null,
        salary_grade_1: 50.0,
        salary_grade_2: 75.0,
        salary_grade_3: null,
        salary_grade_4: null,
        salary_grade_5: null,
        salary_grade_6: null,
        salary_grade_7: null,
        salary_grade_8: null,
        salary_grade_9: null,
        salary_grade_10: null,
        salary_grade_11: null,
        salary_grade_12: null,
        salary_grade_13: null,
        salary_grade_14: null,
        education_level: 'Bachelor',
        degree_type: 'BS',
        certifications: null,
        required_experience: '5 years',
        years_of_experience: '5',
        other_requirements: null,
        special_requirements: null,
        combination_of_requirements: null,
        working_conditions: null,
        is_travel_required: false,
        exemption_status: 'Exempt',
        probationary_period: '6 months',
        is_driver_license_required: true,
        is_background_checked: true,
        is_polygraph_required: false,
        is_medical_examination_required: false,
        is_drug_test_required: true,
        is_physical_examination_required: false,
        is_mental_examination_required: false,
        has_disqualifying_factors: false,
        disqualifying_factors: null,
        has_accommodations: false,
        accommodations: null,
        authorizing_body: 'City Council',
        legal_references: null,
      };

      const job = JobSchema.parse(rawJob);

      expect(job.jobCode).toBe(1234);
      expect(job.roleDefinition).toBe('Test role');
      expect(job.exampleDuties).toBe('Test duties');
      expect(job.reportsTo).toBe('Manager');
      expect(job.salaryGrade1).toBe(50.0);
      expect(job.salaryGrade2).toBe(75.0);
      expect(job.educationLevel).toBe('Bachelor');
      expect(job.isTravelRequired).toBe(false);
      expect(job.isDriverLicenseRequired).toBe(true);
    });

    it('should handle nullable fields', () => {
      const rawJob = {
        jurisdiction: 'sandiego',
        job_code: 1234,
        title: null,
        role_definition: null,
        example_duties: null,
        reports_to: null,
        supported_by: null,
        salary_grade_1: null,
        salary_grade_2: null,
        salary_grade_3: null,
        salary_grade_4: null,
        salary_grade_5: null,
        salary_grade_6: null,
        salary_grade_7: null,
        salary_grade_8: null,
        salary_grade_9: null,
        salary_grade_10: null,
        salary_grade_11: null,
        salary_grade_12: null,
        salary_grade_13: null,
        salary_grade_14: null,
        education_level: null,
        degree_type: null,
        certifications: null,
        required_experience: null,
        years_of_experience: null,
        other_requirements: null,
        special_requirements: null,
        combination_of_requirements: null,
        working_conditions: null,
        is_travel_required: null,
        exemption_status: null,
        probationary_period: null,
        is_driver_license_required: null,
        is_background_checked: null,
        is_polygraph_required: null,
        is_medical_examination_required: null,
        is_drug_test_required: null,
        is_physical_examination_required: null,
        is_mental_examination_required: null,
        has_disqualifying_factors: null,
        disqualifying_factors: null,
        has_accommodations: null,
        accommodations: null,
        authorizing_body: null,
        legal_references: null,
      };

      const job = JobSchema.parse(rawJob);

      expect(job.title).toBeNull();
      expect(job.salaryGrade1).toBeNull();
      expect(job.isTravelRequired).toBeNull();
    });
  });

  describe('getSalaryRange', () => {
    it('should return min and max salary from grades', () => {
      const job = {
        salaryGrade1: 50.0,
        salaryGrade2: 75.0,
        salaryGrade3: 100.0,
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
      } as any;

      const range = getSalaryRange(job);

      expect(range.min).toBe(50.0);
      expect(range.max).toBe(100.0);
    });

    it('should return null values when no salary grades', () => {
      const job = {
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
      } as any;

      const range = getSalaryRange(job);

      expect(range.min).toBeNull();
      expect(range.max).toBeNull();
    });
  });

  describe('hasSalaryInfo', () => {
    it('should return true when salary info exists', () => {
      const job = {
        salaryGrade1: 50.0,
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
      } as any;

      expect(hasSalaryInfo(job)).toBe(true);
    });

    it('should return false when no salary info', () => {
      const job = {
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
      } as any;

      expect(hasSalaryInfo(job)).toBe(false);
    });
  });

  describe('getJobIdentifier', () => {
    it('should format job identifier correctly', () => {
      const job = {
        title: 'Test Position',
        jurisdiction: 'sandiego',
      } as any;

      const identifier = getJobIdentifier(job);

      expect(identifier).toBe('Test Position in Sandiego');
    });

    it('should handle missing title', () => {
      const job = {
        title: null,
        jurisdiction: 'sandiego',
      } as any;

      const identifier = getJobIdentifier(job);

      expect(identifier).toBe('Unknown Position in Sandiego');
    });
  });

  describe('QueryType', () => {
    it('should have all expected query types', () => {
      expect(QueryType.SALARY).toBe('salary');
      expect(QueryType.DUTIES).toBe('duties');
      expect(QueryType.QUALIFICATIONS).toBe('qualifications');
      expect(QueryType.REQUIREMENTS).toBe('requirements');
      expect(QueryType.GENERAL).toBe('general');
    });
  });
});