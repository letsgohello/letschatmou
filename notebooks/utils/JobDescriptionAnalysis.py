# File: notebooks/utils/JobDescriptionAnalysis.py

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import google.generativeai as genai
import json
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


# Your exact schema (keep it the same!)
class JobDescriptionAnalysis(BaseModel):
    """Structured extraction from job description."""

    model_config = ConfigDict(
        populate_by_name=True, extra="forbid", str_strip_whitespace=True
    )

    # Education
    education_level: Optional[str] = Field(
        None,
        description="Required education level (e.g., Bachelor's, Master's, High School). Look under Education, Experience, or Qualification sections.",
    )

    degree_type: Optional[str] = Field(
        None,
        description="Specific degree required (e.g., Computer Science, Business Administration, Engineering)",
    )

    certifications: Optional[List[str]] = Field(
        None,
        description="Certifications required (e.g., CPA, CFA, CFP) and exams. Extract as list.",
    )

    # Role definition
    role_definition: Optional[str] = Field(
        None,
        description="The definition of this role from DEFINITION or Description section. CLASSIFICATION PURPOSE AND DISTINGUISHING CHARACTERISTICS section.",
    )

    # Reporting structure
    reports_to: Optional[str] = Field(
        None,
        description="Who this role reports to (e.g., Chief Officer, Director, Manager)",
    )

    supported_by: Optional[str] = Field(
        None, description="Who supports this role or who this role supervises"
    )

    # Working conditions
    working_conditions: Optional[List[str]] = Field(
        None, description="Bullet points describing working conditions"
    )

    is_travel_required: Optional[bool] = Field(None, description="Is travel required?")

    # Authorization
    authorizing_body: Optional[str] = Field(
        None, description="Who authorizes this position"
    )

    # Legal references
    legal_references: Optional[List[str]] = Field(
        None,
        description="Referenced laws, policies, codes (e.g., California Penal Code sections)",
    )

    # Duties
    example_duties: Optional[List[str]] = Field(
        None, description="List of example duties from EXAMPLES OF DUTIES section"
    )

    # Experience & Skills
    required_experience: Optional[str] = Field(
        None,
        description="Required experience from KNOWLEDGE AND SKILLS, LEADERSHIP COMPETENCIES, DISTINGUISHING CHARACTERISTICS, or Experience sections",
    )

    years_of_experience: Optional[int] = Field(
        None, description="Number of years of experience required (numeric value only)"
    )

    other_requirements: Optional[List[str]] = Field(
        None, description="Knowledge, Skills, Abilities, Other Requirements"
    )

    special_requirements: Optional[List[str]] = Field(
        None,
        description="Special requirements like bilingual skills, language proficiency",
    )

    combination_of_requirements: Optional[List[str]] = Field(
        None,
        description="Combination of requirements from EDUCATION, EXPERIENCE, KNOWLEDGE AND SKILLS, LEADERSHIP COMPETENCIES, DISTINGUISHING CHARACTERISTICS, etc. that make someone a valid candidate for this job.",
    )

    # Status and checks
    exemption_status: Optional[str] = Field(
        None, description="Exemption status: 'Exempt' or 'Non-Exempt'"
    )

    probationary_period: Optional[str] = Field(
        None, description="Probationary period (e.g., '6 months', '1 year')"
    )

    is_driver_license_required: Optional[bool] = Field(
        None, description="Is valid driver's license required?"
    )

    is_background_checked: Optional[bool] = Field(
        None, description="Is background check required?"
    )

    is_polygraph_required: Optional[bool] = Field(
        None, description="Is polygraph examination required?"
    )

    is_medical_examination_required: Optional[bool] = Field(
        None, description="Is medical examination required?"
    )

    is_drug_test_required: Optional[bool] = Field(
        None, description="Is drug test required?"
    )

    is_physical_examination_required: Optional[bool] = Field(
        None, description="Is physical examination required?"
    )

    is_mental_examination_required: Optional[bool] = Field(
        None, description="Is mental examination required?"
    )

    has_disqualifying_factors: Optional[bool] = Field(
        None, description="Does the job description mention disqualifying factors?"
    )

    disqualifying_factors: Optional[List[str]] = Field(
        None, description="List of disqualifying factors"
    )

    has_accommodations: Optional[bool] = Field(
        None,
        description="Does the job description mention accommodations for disabilities?",
    )

    accommodations: Optional[List[str]] = Field(
        None, description="List of accommodations for disabilities"
    )

    def to_flat_dict(self, jurisdiction: str, job_code: str) -> dict:
        """Convert to flat dictionary for DataFrame."""
        data = self.model_dump()
        data["jurisdiction"] = jurisdiction
        data["job_code"] = job_code

        # Convert lists to pipe-separated strings for CSV
        for key, value in data.items():
            if isinstance(value, list) and value:
                data[key] = " | ".join(str(v) for v in value)
            elif isinstance(value, list):
                data[key] = None

        return data


# Extraction function using Gemini (FREE!)
def extract_job_info(
    description: str, model_name: str = "gemini-2.5-flash-lite"
) -> JobDescriptionAnalysis:
    """
    Extract structured information from job description using Gemini.

    Args:
        description: Full job description text
        model_name: Gemini model to use (default: gemini-1.5-flash - FREE)

    Returns:
        JobDescriptionAnalysis: Validated, structured data
    """

    # Initialize model
    model = genai.GenerativeModel(model_name)

    # Generate JSON schema from Pydantic model
    schema = JobDescriptionAnalysis.model_json_schema()

    # Create detailed prompt
    prompt = f"""You are an expert HR data extraction system.
Extract information precisely from this job description using exact phrases from the text.

For each field in the schema:
- Extract exact text where possible
- For lists, extract each item separately
- For booleans, return true/false based on explicit mentions
- If not found or not explicit, return null

Return a valid JSON object matching this exact schema:
{json.dumps(schema, indent=2)}

Job Description:
{description}

Extract all relevant information. Return ONLY valid JSON, no other text."""

    # Call Gemini API
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json", temperature=0
        ),
    )

    # Parse JSON response
    extracted_data = json.loads(response.text)

    # Validate with Pydantic
    return JobDescriptionAnalysis(**extracted_data)
