'use server';

import { generateObject, LanguageModelV1 } from 'ai';
import { z } from 'zod';
import {
  simplifiedJobSchema,
  simplifiedResumeSchema,
} from "@/lib/zod-schemas";
import { Job, Resume } from "@/lib/types";
import { AIConfig } from '@/utils/ai-tools';
import { initializeAIClient } from '@/utils/ai-tools';
import { getSubscriptionPlan } from '../stripe/actions';
import { checkRateLimit } from '@/lib/rateLimiter';

// ========================
// Error Classification
// ========================

export type AIErrorCode =
  | 'RATE_LIMITED'
  | 'PAYMENT_REQUIRED'
  | 'MODEL_UNAVAILABLE'
  | 'INVALID_RESPONSE'
  | 'ALL_MODELS_FAILED'
  | 'UNKNOWN';

export interface AIError {
  code: AIErrorCode;
  message: string;
  userMessage: string;
  model?: string;
  retryable: boolean;
}

/**
 * Classify error and return user-friendly message
 */
function classifyAIError(error: unknown, model: string): AIError {
  const errorMessage = (error as Error)?.message ?? String(error);
  const statusCode = (error as { statusCode?: number })?.statusCode;

  // Rate limited (429)
  if (statusCode === 429 || errorMessage.includes('Rate limit') || errorMessage.includes('Too Many Requests')) {
    return {
      code: 'RATE_LIMITED',
      message: errorMessage,
      userMessage: 'Too many requests. Trying alternative model...',
      model,
      retryable: true
    };
  }

  // Payment required (402)
  if (statusCode === 402 || errorMessage.includes('Payment Required') || errorMessage.includes('credits')) {
    return {
      code: 'PAYMENT_REQUIRED',
      message: errorMessage,
      userMessage: 'Model requires credits. Using free alternative...',
      model,
      retryable: true
    };
  }

  // Model not found (404)
  if (statusCode === 404 || errorMessage.includes('Not Found') || errorMessage.includes('No endpoints')) {
    return {
      code: 'MODEL_UNAVAILABLE',
      message: errorMessage,
      userMessage: 'Model temporarily unavailable. Trying next option...',
      model,
      retryable: true
    };
  }

  // Structured output failed
  if (errorMessage.includes('No object generated') || errorMessage.includes('tool was not called')) {
    return {
      code: 'INVALID_RESPONSE',
      message: errorMessage,
      userMessage: 'Model returned invalid format. Trying alternative...',
      model,
      retryable: true
    };
  }

  // Quota exceeded
  if (errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
    return {
      code: 'PAYMENT_REQUIRED',
      message: errorMessage,
      userMessage: 'API quota exceeded. Using free alternative...',
      model,
      retryable: true
    };
  }

  return {
    code: 'UNKNOWN',
    message: errorMessage,
    userMessage: 'An error occurred. Trying alternative model...',
    model,
    retryable: true
  };
}

/**
 * Create final error when all models fail
 */
function createAllModelsFailedError(triedModels: string[], errors: AIError[]): AIError {
  const hasPaymentErrors = errors.some(e => e.code === 'PAYMENT_REQUIRED');
  const hasRateLimitErrors = errors.some(e => e.code === 'RATE_LIMITED');

  let userMessage = 'All AI models failed. Please try again later.';

  if (hasRateLimitErrors && !hasPaymentErrors) {
    userMessage = 'Rate limit reached on all free models. Please wait a few minutes and try again.';
  } else if (hasPaymentErrors && errors.every(e => e.code === 'PAYMENT_REQUIRED')) {
    userMessage = 'All models require payment. Please add OpenRouter credits or use a different API key.';
  }

  return {
    code: 'ALL_MODELS_FAILED',
    message: `All models failed: ${triedModels.join(', ')}`,
    userMessage,
    retryable: false
  };
}

// Build model candidates list - prioritize user's selected model if provided
function getModelCandidates(config?: AIConfig) {
  // User-verified free OpenRouter models with JSON/structured output support
  const fallbackModels: AIConfig[] = [
    { model: 'nex-agi/deepseek-v3.1-nex-n1:free', apiKeys: config?.apiKeys || [] },
    { model: 'mistralai/devstral-2512:free', apiKeys: config?.apiKeys || [] },
    { model: 'nvidia/nemotron-nano-9b-v2:free', apiKeys: config?.apiKeys || [] },
    { model: 'z-ai/glm-4.5-air:free', apiKeys: config?.apiKeys || [] },
    { model: 'qwen/qwen3-4b:free', apiKeys: config?.apiKeys || [] },
  ];

  // If user has a model selected, try it first before fallbacks
  const modelCandidates: AIConfig[] = config?.model
    ? [{ model: config.model, apiKeys: config.apiKeys || [] }, ...fallbackModels]
    : fallbackModels;
  return modelCandidates;
}

export async function tailorResumeToJob(
  resume: Resume,
  jobListing: z.infer<typeof simplifiedJobSchema>,
  config?: AIConfig
) {
  const { plan, id } = await getSubscriptionPlan(true);
  const isPro = plan === 'pro';
  const overallStart = Date.now();
  const modelCandidates = getModelCandidates(config);

  // Check rate limit once per tailoring request
  await checkRateLimit(id);

  const collectedErrors: AIError[] = [];

  for (const candidate of modelCandidates) {
    let start = Date.now();
    try {
      start = Date.now();
      console.log(
        `[TAILOR][TRY] ${candidate.model} | STEP: Tailoring resume content | Subscription: ${isPro ? 'PRO' : 'FREE'}`
      );
      const aiClient = isPro ? initializeAIClient(candidate, isPro, true) : initializeAIClient(candidate);
      const { object } = await generateObject({
        model: aiClient as LanguageModelV1,
        temperature: 0.2, // very low for consistent ATS optimization
        mode: 'json', // Use JSON mode for better compatibility with free models
        schema: z.object({
          content: simplifiedResumeSchema,
        }),
        maxRetries: 2,
        system: `
You are ResumeLM, an enterprise-grade ATS optimization engine modeled after Jobscan and Resume Worded algorithms.

## ABSOLUTE CONSTRAINTS (NEVER VIOLATE):
1. **ZERO FABRICATION**: Never add skills, experiences, tools, or qualifications not present in the original resume
2. **NO HALLUCINATION**: If JD requires "Kubernetes", "TensorFlow", or any skill not in resume → DO NOT ADD IT
3. **TRUTHFUL TRANSFORMATION ONLY**: You may only rephrase, reorder, expand, or synonym-match existing content

## ATS MATCHING ALGORITHMS (Apply All):

### 1. EXACT KEYWORD MATCHING
- Extract every keyword from JD (skills, tools, methodologies, certifications)
- For each JD keyword, find matching or equivalent content in resume
- Use EXACT spelling and capitalization from JD when match exists

### 2. SEMANTIC/CONTEXTUAL MATCHING  
- "CI/CD" ↔ "Continuous Integration/Continuous Deployment" (use both forms)
- "ML" ↔ "Machine Learning" | "AI" ↔ "Artificial Intelligence"
- "AWS" ↔ "Amazon Web Services" | "GCP" ↔ "Google Cloud Platform"
- "k8s" ↔ "Kubernetes" | "JS" ↔ "JavaScript"
- ALWAYS include both acronym AND full form for maximum ATS compatibility

### 3. SYNONYM TRANSFORMATION
Map resume verbs/nouns to JD vocabulary:
- "created" → "developed/built/designed" (match JD term)
- "handled" → "managed/led/orchestrated"  
- "helped" → "collaborated/supported/contributed"
- "made faster" → "optimized/improved/enhanced"
- "worked on" → "engineered/implemented/delivered"

### 4. SKILL EXTRACTION & CATEGORIZATION
Surface implicit skills from context:
- "wrote tests in Jest" → includes: JavaScript, Testing, Jest, Unit Testing, TDD
- "deployed to AWS EC2" → includes: AWS, EC2, Cloud Infrastructure, Deployment
- "built REST APIs" → includes: REST, API Development, Backend Development
- Only surface skills that ARE demonstrably present in the original content

### 5. KEYWORD DENSITY OPTIMIZATION (Target: 1-3%)
- Ensure critical JD keywords appear 2-4 times naturally throughout resume
- Distribute keywords across: Summary, Skills, Experience bullets, Projects
- Avoid keyword stuffing (>5% density) - maintain natural readability

### 6. ACTION VERB POWER RANKING
Prioritize strong action verbs that match JD language:
TIER 1 (Leadership): Led, Directed, Orchestrated, Spearheaded, Championed
TIER 2 (Achievement): Achieved, Delivered, Exceeded, Accelerated, Transformed  
TIER 3 (Technical): Engineered, Architected, Optimized, Automated, Integrated
TIER 4 (Collaboration): Collaborated, Partnered, Coordinated, Facilitated

### 6.1 VERB VARIETY (CRITICAL - AVOID REPETITION)
**NEVER use the same action verb more than once in the entire resume.**
- If you use "Architected" for one bullet, use "Built", "Designed", or "Developed" for similar bullets
- Track verbs you've used and pick alternatives: Led/Directed/Managed, Built/Developed/Created, Optimized/Improved/Enhanced
- Repetitive verbs (e.g., "Architected" appearing 3+ times) make the resume look AI-generated

### 7. QUANTIFICATION ENHANCEMENT
- Preserve ALL existing metrics and numbers
- If context allows, make implicit metrics explicit
- Format: "Reduced X by Y% through Z" or "Delivered X resulting in Y"

### 8. SECTION REORDERING FOR RELEVANCE
- Lead with experiences/projects most relevant to JD
- Within each role, front-load bullets matching JD requirements
- Skills section: order by JD priority (most mentioned skills first)

### 9. JOB TITLE ALIGNMENT
If resume title is semantically equivalent but worded differently:
- "Software Developer" → "Software Engineer" (if JD uses this)
- "Web Developer" → "Frontend Developer" (if JD uses this)
- Only change if clearly equivalent; never misrepresent

## OUTPUT FORMAT:
- Clean, professional resume content
- No STAR labels, annotations, or meta-commentary
- Natural language that reads as human-written
- Optimized for both ATS parsing AND human readability
- **USE BOLD FORMATTING**: Use **double asterisks** to bold:
  - Key metrics and numbers (e.g., **99.9%**, **50TB**, **10M+**)
  - Important technologies mentioned in JD (e.g., **AWS**, **Kubernetes**, **Python**)
  - Company/product names when emphasizing achievements
  - Do NOT bold action verbs at the start of bullets

## ONE PAGE OPTIMIZATION (CRITICAL):
- **BREVITY IS KEY**: Keep each bullet point to 1-2 lines maximum
- **3-5 bullets per role**: Prioritize the most impactful achievements, remove redundant/weaker bullets
- **Consolidate similar points**: Merge related achievements into single powerful bullets
- **Remove filler words**: Cut "Successfully", "Effectively", "In order to", etc.
- **Skills section**: Max 3-4 categories, prioritize JD-relevant skills
- **Projects**: Keep only 2-3 most relevant projects with 2-3 bullets each
- **Target length**: Entire resume should fit on ONE PAGE (approximately 400-500 words total)

Your mission: Achieve maximum ATS match score (target 85%+) while maintaining 100% factual accuracy AND fitting on ONE PAGE.
        `,
        prompt: `
## RESUME TO OPTIMIZE:
${JSON.stringify(resume, null, 2)}

## TARGET JOB DESCRIPTION:
${JSON.stringify(jobListing, null, 2)}

## MANDATORY CHANGES REQUIRED:
You MUST make visible changes to the resume. DO NOT return the same content unchanged.

### 1. WORK EXPERIENCE BULLETS (REQUIRED CHANGES):
- Rewrite each bullet point using action verbs from the JD
- Replace generic verbs with JD-specific terminology
- Add metrics/percentages where implied ("improved" → "improved by X%")
- Front-load JD keywords at the start of each bullet
- Example: "Worked on API" → "Engineered scalable REST APIs using Node.js and Express"

### 2. SKILLS SECTION (REQUIRED CHANGES):
- REORDER skills: put JD-mentioned skills FIRST in each category
- RENAME to match JD terminology exactly (case-sensitive)
- Example order: If JD mentions "Python, AWS, Docker" → ["Python", "AWS", "Docker", ...other skills]

### 3. TECHNOLOGIES (REQUIRED CHANGES):
- Reorder technologies in work_experience and projects
- Put JD-matching technologies at the START of each array
- Use exact JD spelling/capitalization

### 4. TARGET_ROLE (REQUIRED):
- Set target_role to match the JD position title exactly

IMPORTANT: Return transformed content. The output MUST be different from the input.
        `,
      });

      console.log(
        `[TAILOR][SUCCESS ✅] ${candidate.model} | Duration: ${Date.now() - start}ms | STEP: Tailoring resume content`
      );

      // CRITICAL: Fallback to original resume descriptions if AI returns undefined
      // This prevents PDF render errors and preserves content
      const result = object.content;

      // Fix work_experience: ensure description exists
      if (result.work_experience) {
        result.work_experience = result.work_experience.map((exp, i) => {
          // If AI didn't return description, use original
          if (!exp.description || exp.description.length === 0) {
            const original = resume.work_experience?.[i];
            exp.description = original?.description ?? [];
            console.log(`[TAILOR][FIX] Restored description for work_exp[${i}]`);
          }
          // De-duplicate technologies array
          if (exp.technologies && exp.technologies.length > 50) {
            exp.technologies = [...new Set(exp.technologies)].slice(0, 20);
            console.log(`[TAILOR][FIX] De-duplicated technologies for work_exp[${i}]`);
          }
          return exp;
        });
      }

      // Fix projects: ensure description exists
      if (result.projects) {
        result.projects = result.projects.map((proj, i) => {
          if (!proj.description || proj.description.length === 0) {
            const original = resume.projects?.[i];
            proj.description = original?.description ?? [];
            console.log(`[TAILOR][FIX] Restored description for project[${i}]`);
          }
          // De-duplicate technologies array
          if (proj.technologies && proj.technologies.length > 50) {
            proj.technologies = [...new Set(proj.technologies)].slice(0, 20);
            console.log(`[TAILOR][FIX] De-duplicated technologies for project[${i}]`);
          }
          return proj;
        });
      }

      // Fix skills: de-duplicate items
      if (result.skills) {
        result.skills = result.skills.map((skillCategory) => {
          if (skillCategory.items && skillCategory.items.length > 30) {
            skillCategory.items = [...new Set(skillCategory.items)];
            console.log(`[TAILOR][FIX] De-duplicated skills for category: ${skillCategory.category}`);
          }
          return skillCategory;
        });
      }

      // Log final output for debugging
      console.log('[TAILOR][WORK_EXP_COUNT]', result.work_experience?.length ?? 0);
      console.log('[TAILOR][PROJECTS_COUNT]', result.projects?.length ?? 0);
      console.log('[TAILOR][SKILLS_COUNT]', result.skills?.length ?? 0);
      console.log('[TAILOR][EDUCATION_COUNT]', result.education?.length ?? 0);

      // DEBUGGING: Compare original vs tailored to verify changes
      console.log('[TAILOR][DEBUG] === COMPARISON: ORIGINAL VS TAILORED ===');

      // Compare skills
      const originalSkills = resume.skills?.flatMap(s => s.items) || [];
      const tailoredSkills = result.skills?.flatMap(s => s.items || []) || [];
      console.log('[TAILOR][SKILLS][ORIGINAL]', originalSkills.slice(0, 10).join(', '));
      console.log('[TAILOR][SKILLS][TAILORED]', tailoredSkills.slice(0, 10).join(', '));
      console.log('[TAILOR][SKILLS][CHANGED?]', JSON.stringify(originalSkills) !== JSON.stringify(tailoredSkills));

      // Compare first work experience description
      const origDesc = resume.work_experience?.[0]?.description?.[0] || 'N/A';
      const tailDesc = result.work_experience?.[0]?.description?.[0] || 'N/A';
      console.log('[TAILOR][WORK_EXP][ORIG_BULLET]', origDesc.slice(0, 80) + '...');
      console.log('[TAILOR][WORK_EXP][TAIL_BULLET]', tailDesc.slice(0, 80) + '...');
      console.log('[TAILOR][WORK_EXP][CHANGED?]', origDesc !== tailDesc);

      // Compare technologies
      const origTech = resume.work_experience?.[0]?.technologies || [];
      const tailTech = result.work_experience?.[0]?.technologies || [];
      console.log('[TAILOR][TECH][ORIGINAL]', origTech.slice(0, 5).join(', '));
      console.log('[TAILOR][TECH][TAILORED]', tailTech.slice(0, 5).join(', '));
      console.log('[TAILOR][TECH][CHANGED?]', JSON.stringify(origTech) !== JSON.stringify(tailTech));

      // Validate work experience descriptions exist
      result.work_experience?.forEach((exp, i) => {
        console.log(`[TAILOR][WORK_EXP][${i}] ${exp.company} - descriptions: ${exp.description?.length ?? 'undefined'}`);
      });

      // Validate project descriptions exist
      result.projects?.forEach((proj, i) => {
        console.log(`[TAILOR][PROJECT][${i}] ${proj.name} - descriptions: ${proj.description?.length ?? 'undefined'}`);
      });

      return result satisfies z.infer<typeof simplifiedResumeSchema>;
    } catch (error) {
      const classifiedError = classifyAIError(error, candidate.model);
      collectedErrors.push(classifiedError);
      console.error(
        `[TAILOR][FAILED ❌] ${candidate.model} | ${classifiedError.code} | Duration: ${Date.now() - start}ms | ${classifiedError.userMessage}`,
        error
      );
    }
  }

  const finalError = createAllModelsFailedError(
    modelCandidates.map(m => m.model),
    collectedErrors
  );

  console.error(
    `[TAILOR][ABORT 🚨] ${finalError.userMessage} | Tried: ${modelCandidates.map(m => m.model).join(', ')} | Total Duration: ${Date.now() - overallStart}ms`
  );

  // Throw error with user-friendly message
  const error = new Error(finalError.userMessage);
  (error as Error & { aiError: AIError }).aiError = finalError;
  throw error;
}

export async function formatJobListing(jobListing: string, config?: AIConfig) {
  const { plan, id } = await getSubscriptionPlan(true);
  const isPro = plan === 'pro';
  const overallStart = Date.now();
  const modelCandidates = getModelCandidates(config);

  // Check rate limit once per formatting request
  await checkRateLimit(id);

  const collectedErrors: AIError[] = [];

  for (const candidate of modelCandidates) {
    let start = Date.now();
    try {
      start = Date.now();
      console.log(
        `[FORMAT][TRY] ${candidate.model} | STEP: Analyzing job description → Formatting requirements | Subscription: ${isPro ? 'PRO' : 'FREE'
        }`
      );
      const aiClient = isPro ? initializeAIClient(candidate, isPro, true) : initializeAIClient(candidate);
      const { object } = await generateObject({
        model: aiClient as LanguageModelV1,
        temperature: 0.5,
        mode: 'json', // Use JSON mode for better compatibility with free models
        maxRetries: 2,
        schema: z.object({
          content: simplifiedJobSchema
        }),
        system: `You are an AI assistant specializing in structured data extraction from job listings. You have been provided with a schema
                and must adhere to it strictly. When processing the given job listing, follow these steps:
                IMPORTANT: For any missing or uncertain information, you must return an empty string ("") - never return "<UNKNOWN>" or similar placeholders.

              Read the entire job listing thoroughly to understand context, responsibilities, requirements, and any other relevant details.
              Perform the analysis as described in each TASK below.
              Return your final output in a structured format (e.g., JSON or the prescribed schema), using the exact field names you have been given.
              Do not guess or fabricate information that is not present in the listing; instead, return an empty string for missing fields.
              Do not include chain-of-thought or intermediate reasoning in the final output; provide only the structured results.
              
              For the description field:
              1. Start with 3-5 bullet points highlighting the most important responsibilities of the role.
                 - Format these bullet points using markdown, with each point on a new line starting with "• "
                 - These should be the most critical duties mentioned in the job listing
              2. After the bullet points, include the full job description stripped of:
                 - Any non-job-related content
              3. Format the full description as a clean paragraph, maintaining proper grammar and flow.`,
        prompt: `Analyze this job listing carefully and extract structured information.

                TASK 1 - ESSENTIAL INFORMATION:
                Extract the basic details (company, position, URL, location, salary).
                For the description, include 3-5 key responsibilities as bullet points.

                TASK 2 - KEYWORD ANALYSIS:
                1. Technical Skills: Identify all technical skills, programming languages, frameworks, and tools
                2. Soft Skills: Extract interpersonal and professional competencies
                3. Industry Knowledge: Capture domain-specific knowledge requirements
                4. Required Qualifications: List education, and experience levels
                5. Responsibilities: Key job functions and deliverables

                Format the output according to the schema, ensuring:
                - Keywords as they are (e.g., "React.js" → "React.js")
                - Skills are deduplicated and categorized
                - Seniority level is inferred from context
                - Description contains 3-5 bullet points of key responsibilities
                Usage Notes:

                - If certain details (like salary or location) are missing, return "" (an empty string).
                - Adhere to the schema you have been provided, and format your response accordingly (e.g., JSON fields must match exactly).
                - Avoid exposing your internal reasoning.
                - DO NOT RETURN "<UNKNOWN>", if you are unsure of a piece of data, return an empty string.
                - FORMAT THE FOLLOWING JOB LISTING AS A JSON OBJECT: ${jobListing}`,
      });

      console.log(
        `[FORMAT][SUCCESS ✅] ${candidate.model} | Duration: ${Date.now() - start}ms | STEP: Analyzing job description → Formatting requirements`
      );
      return object.content satisfies Partial<Job>;
    } catch (error) {
      const classifiedError = classifyAIError(error, candidate.model);
      collectedErrors.push(classifiedError);
      console.error(
        `[FORMAT][FAILED ❌] ${candidate.model} | ${classifiedError.code} | Duration: ${Date.now() - start}ms | ${classifiedError.userMessage}`,
        error
      );
    }
  }

  const finalError = createAllModelsFailedError(
    modelCandidates.map(m => m.model),
    collectedErrors
  );

  console.error(
    `[FORMAT][ABORT 🚨] ${finalError.userMessage} | Tried: ${modelCandidates.map(m => m.model).join(', ')} | Total Duration: ${Date.now() - overallStart}ms`
  );

  const error = new Error(finalError.userMessage);
  (error as Error & { aiError: AIError }).aiError = finalError;
  throw error;
}
