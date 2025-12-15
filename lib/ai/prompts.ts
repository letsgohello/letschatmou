/**
 * System prompts and context formatting for the AI assistant.
 * Defines the personality, behavior, and output format for the chatbot.
 */

import type { Job } from '@/lib/data/types';
import { getSalaryRange, hasSalaryInfo } from '@/lib/data/types';

/**
 * System prompt that defines the AI assistant's role and behavior.
 */
export const SYSTEM_PROMPT = `You are a helpful HR assistant that answers questions about job positions and salaries in California counties.

Guidelines for responses:
- Be concise but informative
- Use bullet points and markdown formatting for lists (duties, qualifications, requirements)
- Format salary information clearly with ranges when available
- If multiple jobs match, mention how many and describe the most relevant one(s)
- If no jobs match, politely explain and suggest they check the jurisdiction or job title
- Use professional but friendly tone
- When listing duties or requirements, break them into readable bullet points
- Cite the specific position and jurisdiction in your answer
- Always reference actual data from the job listings provided

Example response format:

**Assistant Chief Probation Officer** in **San Bernardino County**:

**Salary Range:** $70.38 - $101.00 per hour (Grades 1-2)

**Key Responsibilities:**
- Assist the Chief Probation Officer in policy formulation
- Direct major divisions and programs
- Manage budget and fiscal operations
- Coordinate with courts and law enforcement

**Requirements:**
- Must meet specific qualifications...

Remember to always use the job data provided in context to give accurate, specific answers.`;

/**
 * Format filtered job data as structured text context for the LLM.
 * Provides comprehensive information while remaining readable.
 */
export function formatJobContext(jobs: Job[]): string {
  if (jobs.length === 0) {
    return 'No matching jobs found.';
  }

  // Format all jobs provided (don't hardcode a limit here)
  const formattedJobs = jobs.map((job, index) => {
    const parts: string[] = [
      `=== JOB ${index + 1} ===`,
      `Title: ${job.title || 'N/A'}`,
      `Jurisdiction: ${job.jurisdiction}`,
      `Job Code: ${job.jobCode}`,
    ];

    // Salary information
    if (hasSalaryInfo(job)) {
      const { min, max } = getSalaryRange(job);
      parts.push(`Salary Range: $${min?.toFixed(2)} - $${max?.toFixed(2)} per hour`);
      
      // List individual grades if available
      const grades: string[] = [];
      if (job.salaryGrade1) grades.push(`Grade 1: $${job.salaryGrade1}`);
      if (job.salaryGrade2) grades.push(`Grade 2: $${job.salaryGrade2}`);
      if (job.salaryGrade3) grades.push(`Grade 3: $${job.salaryGrade3}`);
      if (job.salaryGrade4) grades.push(`Grade 4: $${job.salaryGrade4}`);
      if (grades.length > 0) {
        parts.push(`Salary Grades: ${grades.join(', ')}`);
      }
    }

    // Role definition
    if (job.roleDefinition) {
      parts.push(`\nRole Definition:\n${job.roleDefinition}`);
    }

    // Reports to
    if (job.reportsTo) {
      parts.push(`\nReports To: ${job.reportsTo}`);
    }

    // Example duties (formatted as list)
    if (job.exampleDuties) {
      const duties = job.exampleDuties
        .split('|')
        .map((d: string) => d.trim())
        .filter((d: string) => d.length > 0);
      
      if (duties.length > 0) {
        parts.push('\nExample Duties:');
        duties.forEach((duty: string) => {
          parts.push(`- ${duty}`);
        });
      }
    }

    // Education and experience
    if (job.educationLevel) {
      parts.push(`\nEducation Level: ${job.educationLevel}`);
    }
    if (job.degreeType) {
      parts.push(`Degree Type: ${job.degreeType}`);
    }
    if (job.requiredExperience) {
      parts.push(`Required Experience: ${job.requiredExperience}`);
    }
    if (job.yearsOfExperience) {
      parts.push(`Years of Experience: ${job.yearsOfExperience}`);
    }

    // Certifications and requirements
    if (job.certifications) {
      parts.push(`\nCertifications: ${job.certifications}`);
    }
    if (job.specialRequirements) {
      const requirements = job.specialRequirements
        .split('|')
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 0);
      
      if (requirements.length > 0) {
        parts.push('\nSpecial Requirements:');
        requirements.forEach((req: string) => {
          parts.push(`- ${req}`);
        });
      }
    }

    // Working conditions
    if (job.workingConditions) {
      parts.push(`\nWorking Conditions: ${job.workingConditions}`);
    }
    if (job.isTravelRequired !== null) {
      parts.push(`Travel Required: ${job.isTravelRequired ? 'Yes' : 'No'}`);
    }

    // Background checks and requirements
    const checks: string[] = [];
    if (job.isDriverLicenseRequired) checks.push('Driver License');
    if (job.isBackgroundChecked) checks.push('Background Check');
    if (job.isPolygraphRequired) checks.push('Polygraph');
    if (job.isMedicalExaminationRequired) checks.push('Medical Exam');
    if (job.isDrugTestRequired) checks.push('Drug Test');
    if (job.isPhysicalExaminationRequired) checks.push('Physical Exam');
    if (job.isMentalExaminationRequired) checks.push('Mental Exam');
    
    if (checks.length > 0) {
      parts.push(`\nRequired Checks: ${checks.join(', ')}`);
    }

    return parts.join('\n');
  });

  const header = `Found ${jobs.length} matching job(s):\n\n`;
  return header + formattedJobs.join('\n\n');
}
