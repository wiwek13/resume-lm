'use server';

// import { RESUME_IMPORTER_SYSTEM_MESSAGE, } from "@/lib/prompts";
import { Resume } from "@/lib/types";
import { textImportSchema, workExperienceBulletPointsSchema } from "@/lib/zod-schemas";
import { generateObject, type LanguageModelV1 } from "ai";
import { z } from "zod";
import { initializeAIClient, type AIConfig } from '@/utils/ai-tools';
import { getSubscriptionPlan } from "@/utils/actions/stripe/actions";
import { PROJECT_GENERATOR_MESSAGE, PROJECT_IMPROVER_MESSAGE, TEXT_ANALYZER_SYSTEM_MESSAGE, WORK_EXPERIENCE_GENERATOR_MESSAGE, WORK_EXPERIENCE_IMPROVER_MESSAGE } from "@/lib/prompts";
import { projectAnalysisSchema, workExperienceItemsSchema } from "@/lib/zod-schemas";
import { WorkExperience } from "@/lib/types";
import { getDefaultModel } from "@/lib/ai-models";
import { withAIErrorHandling } from "@/lib/ai-error-handling";

const HUMANIZATION_GUIDELINES = `
HUMANIZATION RULES (Balance, Not Elimination):

IMPORTANT: This is about MODERATION, not replacing everything. Standard resume format is fine.

1. AVOID REPETITION OF BUZZWORDS:
   - Using "Spearheaded" once is fine. Using it 5 times is robotic.
   - Mix up your verbs naturally - don't repeat the same word in consecutive bullets
   - Variety is key, not elimination

2. BALANCE METRICS:
   - 2-3 strong metrics on a resume is effective
   - Forcing a percentage/number on EVERY bullet point looks AI-generated
   - "Reduced costs by 40%" is great; "Improved X by 15%, Y by 20%, Z by 12%..." feels manufactured

3. BE SPECIFIC OVER GENERIC:
   - Include actual technologies, project context, or team sizes
   - "Built REST API with Node.js" > "Engineered scalable backend solutions"

4. KEEP PROFESSIONAL FORMAT:
   - Standard bullet structure: [Action verb] [what you did] [context/result]
   - Do NOT use "I" statements or conversational language
   - This is a resume, not a blog post
`;



// Base Resume Creation
// TEXT CONTENT -> RESUME
export async function convertTextToResume(prompt: string, existingResume: Resume, targetRole: string, config?: AIConfig) {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const fallbackModel = getDefaultModel(isPro);
  const resolvedConfig: AIConfig = {
    model: config?.model || fallbackModel,
    apiKeys: config?.apiKeys || [],
    ...(config?.customPrompts ? { customPrompts: config.customPrompts } : {})
  };

  let aiClient: LanguageModelV1;
  try {
    aiClient = initializeAIClient(resolvedConfig, isPro, isPro);
  } catch (error) {
    if (resolvedConfig.model !== fallbackModel) {
      console.warn(`Falling back to default model (${fallbackModel}) after failing to init ${resolvedConfig.model}:`, error);
      aiClient = initializeAIClient(
        { ...resolvedConfig, model: fallbackModel },
        isPro,
        isPro
      );
    } else {
      throw error;
    }
  }

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: textImportSchema
    }),
    system: `You are ResumeFormatter, an expert system specialized in analyzing complete resumes and converting them into a structured JSON object tailored for targeted job applications.

        Your task is to transform the complete resume text into a JSON object according to the provided schema. You will identify and extract the most relevant experiences, skills, projects, and educational background based on the target role. While doing so, you are allowed to make minimal formatting changes only to enhance clarity and highlight relevance—**do not reword, summarize, or alter the core details of any content.**

        CRITICAL DIRECTIVES:
        1. **Analysis & Selection:**
          - Analyze the full resume text that includes all user experiences, skills, projects, and education.
          - Identify the items that best match the target role: ${targetRole}.
          - Always include the education section:
            - If only one educational entry exists, include it.
            - If multiple entries exist, select the one(s) most relevant to the target role.

        2. **Formatting & Emphasis:**
          - Transform the resume into a JSON object following the schema, with sections such as basic information, professional experience, projects, skills, and education.
          - Preserve all original details, dates, and descriptions. Only modify the text for formatting purposes.
          - **Enhance relevance by marking keywords** within work experience descriptions, project details, achievements, and education details with bold formatting (i.e., wrap them with two asterisks like **this**). Apply this only to keywords or phrases that are highly relevant to the target role.
          - Do not add any formatting to section titles or headers.
          - Use empty arrays ([]) for any sections that do not contain relevant items.

        3. **Output Requirements:**
          - The final output must be a valid JSON object that adheres to the specified schema.
          - Include only the most relevant items, optimized for the target role.
          - Do not add any new information or rephrase the provided content—only apply minor formatting (like bolding) to emphasize key points.
        `,
    prompt: `INPUT:
    Extract and transform the resume information from the following text:
    ${prompt}
    Now, format this information into the JSON object according to the schema, ensuring it is optimized for the target role: ${targetRole}.`,

  }));

  const updatedResume = {
    ...existingResume,
    ...(object.content.first_name && { first_name: object.content.first_name }),
    ...(object.content.last_name && { last_name: object.content.last_name }),
    ...(object.content.email && { email: object.content.email }),
    ...(object.content.phone_number && { phone_number: object.content.phone_number }),
    ...(object.content.location && { location: object.content.location }),
    ...(object.content.website && { website: object.content.website }),
    ...(object.content.linkedin_url && { linkedin_url: object.content.linkedin_url }),
    ...(object.content.github_url && { github_url: object.content.github_url }),

    work_experience: [...existingResume.work_experience, ...(object.content.work_experience || [])],
    education: [...existingResume.education, ...(object.content.education || [])],
    skills: [...existingResume.skills, ...(object.content.skills || [])],
    projects: [...existingResume.projects, ...(object.content.projects || [])],
  };


  return updatedResume;
}



// NEW WORK EXPERIENCE BULLET POINTS
export async function generateWorkExperiencePoints(
  position: string,
  company: string,
  technologies: string[],
  targetRole: string,
  numPoints: number = 3,
  customPrompt: string = '',
  config?: AIConfig,
  existingPoints?: string[]
) {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  // Use custom prompt if provided in config, otherwise fall back to default
  const systemPrompt = config?.customPrompts?.workExperienceGenerator
    ?? (WORK_EXPERIENCE_GENERATOR_MESSAGE.content as string);

  // Build context from existing points
  const existingContext = existingPoints && existingPoints.length > 0
    ? `\n\nExisting bullet points (improve and enhance these, DO NOT add new unrelated points):\n${existingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
    : '';

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: workExperienceBulletPointsSchema
    }),
    prompt: `Position: ${position}
      Company: ${company}
      Technologies: ${technologies.join(', ')}
      Target Role: ${targetRole}
      Number of Points: ${numPoints}${customPrompt ? `\nCustom Focus: ${customPrompt}` : ''}${existingContext}
      
IMPORTANT: ${existingPoints && existingPoints.length > 0
        ? 'Rewrite and IMPROVE the existing bullet points. ' + HUMANIZATION_GUIDELINES
        : 'Generate new professional bullet points. ' + HUMANIZATION_GUIDELINES}`,
    system: systemPrompt,
  }));

  return object.content;
}

// WORK EXPERIENCE BULLET POINTS IMPROVEMENT
export async function improveWorkExperience(point: string, customPrompt?: string, config?: AIConfig) {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  // Use custom prompt if provided in config, otherwise fall back to default
  const systemPrompt = config?.customPrompts?.workExperienceImprover
    ?? (WORK_EXPERIENCE_IMPROVER_MESSAGE.content as string);

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,

    schema: z.object({
      content: z.string().describe("The improved work experience bullet point")
    }),
    prompt: `Please improve this work experience bullet point while maintaining its core message and truthfulness${customPrompt ? `. Additional requirements: ${customPrompt}` : ''}:\n\n"${point}"\n\n${HUMANIZATION_GUIDELINES}`,
    system: systemPrompt,
  }));


  return object.content;
}

// PROJECT BULLET POINTS IMPROVEMENT
export async function improveProject(point: string, customPrompt?: string, config?: AIConfig) {

  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  // Use custom prompt if provided in config, otherwise fall back to default
  const systemPrompt = config?.customPrompts?.projectImprover
    ?? (PROJECT_IMPROVER_MESSAGE.content as string);

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: z.string().describe("The improved project bullet point")
    }),
    prompt: `Please improve this project bullet point while maintaining its core message and truthfulness${customPrompt ? `. Additional requirements: ${customPrompt}` : ''}:\n\n"${point}"\n\n${HUMANIZATION_GUIDELINES}`,
    system: systemPrompt,
  }));

  return object.content;
}

// NEW PROJECT BULLET POINTS
export async function generateProjectPoints(
  projectName: string,
  technologies: string[],
  targetRole: string,
  numPoints: number = 3,
  customPrompt: string = '',
  config?: AIConfig
) {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  // Use custom prompt if provided in config, otherwise fall back to default
  const systemPrompt = config?.customPrompts?.projectGenerator
    ?? (PROJECT_GENERATOR_MESSAGE.content as string);

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: projectAnalysisSchema
    }),
    prompt: `Project Name: ${projectName}
      Technologies: ${technologies.join(', ')}
      Target Role: ${targetRole}
      Number of Points: ${numPoints}${customPrompt ? `\nCustom Focus: ${customPrompt}` : ''}\n\n${HUMANIZATION_GUIDELINES}`,
    system: systemPrompt,
  }));

  return object.content;
}

// Text Import for profile
export async function processTextImport(text: string, config?: AIConfig) {
  const aiClient = initializeAIClient(config);

  // Use custom prompt if provided in config, otherwise fall back to default
  const systemPrompt = config?.customPrompts?.textAnalyzer
    ?? (TEXT_ANALYZER_SYSTEM_MESSAGE.content as string);

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: textImportSchema
    }),
    prompt: text,
    system: systemPrompt,
  }));

  return object.content;
}

// WORK EXPERIENCE MODIFICATION
export async function modifyWorkExperience(
  experience: WorkExperience[],
  prompt: string,
  config?: AIConfig
) {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: workExperienceItemsSchema
    }),
    prompt: `Please modify this work experience entry according to these instructions: ${prompt}\n\nCurrent work experience:\n${JSON.stringify(experience, null, 2)}`,
    system: `You are a professional resume writer. Modify the given work experience based on the user's instructions. 
          Maintain professionalism and accuracy while implementing the requested changes. 
          Keep the same company and dates, but modify other fields as requested.
          Keep the same company and dates, but modify other fields as requested.
          ${HUMANIZATION_GUIDELINES}`,
  }));

  return object.content;
}

// ADDING TEXT CONTENT TO RESUME
export async function addTextToResume(prompt: string, existingResume: Resume, config?: AIConfig) {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  // Use custom prompt if provided in config, otherwise fall back to default
  const systemPrompt = config?.customPrompts?.textAnalyzer
    ?? (TEXT_ANALYZER_SYSTEM_MESSAGE.content as string);

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: textImportSchema
    }),
    prompt: `Extract relevant resume information from the following text, including basic information (name, contact details, etc) and professional experience. Format them according to the schema:\n\n${prompt}`,
    system: systemPrompt,
  }));

  // Merge the AI-generated content with existing resume data
  const updatedResume = {
    ...existingResume,
    ...(object.content.first_name && { first_name: object.content.first_name }),
    ...(object.content.last_name && { last_name: object.content.last_name }),
    ...(object.content.email && { email: object.content.email }),
    ...(object.content.phone_number && { phone_number: object.content.phone_number }),
    ...(object.content.location && { location: object.content.location }),
    ...(object.content.website && { website: object.content.website }),
    ...(object.content.linkedin_url && { linkedin_url: object.content.linkedin_url }),
    ...(object.content.github_url && { github_url: object.content.github_url }),

    work_experience: [...existingResume.work_experience, ...(object.content.work_experience || [])],
    education: [...existingResume.education, ...(object.content.education || [])],
    skills: [...existingResume.skills, ...(object.content.skills || [])],
    projects: [...existingResume.projects, ...(object.content.projects || [])],
  };

  return updatedResume;
}

// ENHANCE SKILLS WITH AI
export async function enhanceSkills(
  existingSkills: { category: string; items: string[] }[],
  jobKeywords: string[],
  targetRole: string,
  config?: AIConfig
) {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  const skillsSchema = z.object({
    skills: z.array(z.object({
      category: z.string().describe("Category name for the skill group"),
      items: z.array(z.string()).describe("List of skills in this category")
    }))
  });

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: skillsSchema
    }),
    mode: 'json',
    prompt: `## EXISTING SKILLS:
${JSON.stringify(existingSkills, null, 2)}

## JOB KEYWORDS TO PRIORITIZE:
${jobKeywords.join(', ')}

## TARGET ROLE:
${targetRole}

## INSTRUCTIONS:
1. REORDER skills so JD-matching skills appear FIRST in each category
2. RENAME categories if needed (e.g., "Programming" → "Languages & Frameworks" if JD uses that term)
3. Use EXACT JD terminology for skill names (case-sensitive matching)
4. Merge similar categories if it makes sense
5. Keep all existing skills - DO NOT remove any
6. Add relevant skills ONLY if they are clearly implied by existing skills (e.g., if "React" exists, can add "Frontend Development")
7. Maximum 4-6 categories for clean presentation
8. Order categories by relevance to JD (most important first)`,
    system: `You are an ATS optimization expert. Your job is to reorganize and enhance skills sections to maximize keyword matches with job descriptions.

RULES:
- NEVER fabricate new skills that aren't implied by existing ones
- Preserve all existing skills
- Use industry-standard terminology
- Match JD capitalization exactly (e.g., "JavaScript" not "Javascript")
- Group similar skills logically
- Order by relevance to the target role`
  }));

  return object.content.skills;
}

// SUGGEST MISSING SKILLS FROM JD
export async function suggestMissingSkills(
  existingSkills: { category: string; items: string[] }[],
  jobDescription: string,
  jobKeywords: string[],
  config?: AIConfig
): Promise<{ category: string; skill: string; reason: string; priority: 'high' | 'medium' | 'low' }[]> {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  const suggestionSchema = z.object({
    suggestions: z.array(z.object({
      category: z.string().describe("Category this skill belongs to"),
      skill: z.string().describe("The skill name"),
      reason: z.string().describe("Why this skill is important for this role"),
      priority: z.enum(['high', 'medium', 'low']).describe("Priority based on how often mentioned in JD")
    }))
  });

  const allExistingSkills = existingSkills.flatMap(s => s.items).map(s => s.toLowerCase());

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: suggestionSchema
    }),
    mode: 'json',
    prompt: `## EXISTING SKILLS IN RESUME:
${existingSkills.map(s => `${s.category}: ${s.items.join(', ')}`).join('\n')}

## JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

## EXTRACTED KEYWORDS FROM JD:
${jobKeywords.join(', ')}

## TASK:
Identify skills mentioned in the job description that are MISSING from the resume.

## RULES:
1. Only suggest skills explicitly mentioned or strongly implied in the JD
2. Do NOT suggest skills already in the resume (even if spelled differently)
3. Prioritize based on frequency/emphasis in JD:
   - HIGH: Mentioned 3+ times or listed as "required"
   - MEDIUM: Mentioned 1-2 times or listed as "preferred"
   - LOW: Mentioned once or implied
4. Use EXACT terminology from the JD
5. Maximum 10 suggestions
6. Group into appropriate categories
7. Provide brief reason why each skill matters for this role`,
    system: `You are an ATS expert helping candidates identify skill gaps. Analyze the job description and suggest skills the candidate should consider adding to their resume. Be conservative - only suggest skills that are genuinely important for this role and that the candidate might actually have based on their existing skills and experience.`
  }));

  // Filter out any suggestions that match existing skills (case-insensitive)
  return object.content.suggestions.filter(
    s => !allExistingSkills.includes(s.skill.toLowerCase())
  );
}

// ANALYZE HUMAN SCORE
export async function analyzeHumanScore(
  text: string,
  config?: AIConfig
): Promise<{ score: number; feedback: string[]; improvements: string[] }> {
  const subscriptionPlan = await getSubscriptionPlan();
  const isPro = subscriptionPlan === 'pro';
  const aiClient = isPro ? initializeAIClient(config, isPro) : initializeAIClient(config);

  const scoreSchema = z.object({
    score: z.number().min(0).max(100).describe("0 = robotic/AI-generated, 100 = completely human/natural"),
    feedback: z.array(z.string()).describe("Specific feedback on why the score was given"),
    improvements: z.array(z.string()).describe("Actionable suggestions to sound more human")
  });

  const { object } = await withAIErrorHandling(() => generateObject({
    model: aiClient,
    schema: z.object({
      content: scoreSchema
    }),
    prompt: `Analyze the following resume text for "human-ness" while keeping in mind this is a RESUME.
    
    TEXT TO ANALYZE:
    "${text.slice(0, 4000)}"
    
    CRITERIA FOR "HUMAN" (HIGHER SCORE):
    - Good variety in action verbs (not repeating the same words)
    - 2-3 meaningful metrics, not forced numbers on every line
    - Specific technical details and context
    - Professional but not robotic
    
    CRITERIA FOR "ROBOTIC" (LOWER SCORE):
    - Same buzzword repeated multiple times (e.g., "Spearheaded" used 4+ times)
    - Every single bullet has a forced percentage/metric
    - Generic phrases with no specific context
    - Identical bullet structure throughout
    
    IMPORTANT FOR IMPROVEMENTS:
    - Do NOT suggest using "I" or conversational language
    - It's fine to use "Spearheaded" once - flag it only if used repeatedly
    - It's fine to have metrics - flag only if EVERY bullet has forced numbers
    - Keep professional resume format
    
    Provide a score from 0-100, feedback on repetition/balance issues, and 3 practical improvements.`,
    system: `You are a resume writing expert. Focus on REPETITION and BALANCE issues, not eliminating specific words. One "Spearheaded" is fine; five is robotic. A few metrics are good; forcing them everywhere is AI-like.`
  }));

  return object.content;
}
