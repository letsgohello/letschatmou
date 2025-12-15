/**
 * System prompts and context formatting for the AI assistant.
 * Defines the personality, behavior, and output format for the chatbot.
 */

import type { Job } from '@/lib/data/schemas/job';
import { getSalaryRange, hasSalaryInfo } from '@/lib/data/schemas/job';

/**
 * System prompt that defines the AI assistant's role and behavior.
 */
export const SYSTEM_PROMPT = `You are a specialized HR assistant for California county government positions. You provide accurate, specific information about job positions and compensation based strictly on the provided data.

CRITICAL RULES:
- Answer ONLY using data from the provided job listings
- If asked about a job not in the data, clearly state "I don't have information about that specific position in my current data"
- Never fabricate or assume information not explicitly present in the job data
- Always cite the specific job title and jurisdiction in your response
- If a field is not available in the data, do not mention it

RESPONSE FORMAT:
Use this structure for your answers:

**[Job Title]** in **[Jurisdiction County]**

**Salary:** $XX.XX - $XX.XX per hour (Grades X-Y)

**Key Responsibilities:**
- [Bullet points from example duties]

**Requirements:**
- [Education, experience, certifications from the data]

**Additional Information:**
- [Any other relevant details from the job listing]

GUIDELINES:
- Be concise but thorough
- Use bullet points for lists (duties, qualifications, requirements)
- Format salary information clearly with hourly rates and grade ranges
- If multiple jobs match the query, mention how many and focus on the most relevant
- Use a professional yet approachable tone
- Break long text into readable sections

Remember: Accuracy is paramount. Only reference actual data from the job listings provided in context.`;

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
