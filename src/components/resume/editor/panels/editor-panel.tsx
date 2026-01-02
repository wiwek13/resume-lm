'use client';

import { Resume, Profile, Job, DocumentSettings } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Suspense, useRef } from "react";
import { cn } from "@/lib/utils";
import { ResumeEditorActions } from "../actions/resume-editor-actions";
import { TailoredJobAccordion } from "../../management/cards/tailored-job-card";
import { BasicInfoForm } from "../forms/basic-info-form";
import ChatBot from "../../assistant/chatbot";
import { CoverLetterPanel } from "./cover-letter-panel";
import {
  WorkExperienceForm,
  EducationForm,
  SkillsForm,
  ProjectsForm,
  DocumentSettingsForm
} from '../dynamic-components';
import { ResumeEditorTabs } from "../header/resume-editor-tabs";
import ResumeScorePanel from "./resume-score-panel";
import { SectionOrderForm } from "../forms/section-order-form";
import { CustomSectionsForm } from "../forms/custom-sections-form";
import { HumanScoreDialog } from "../../shared/human-score-dialog";
import { analyzeHumanScore } from "@/utils/actions/resumes/ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";
import { ApiErrorDialog } from "@/components/ui/api-error-dialog";
import { getUserFacingError } from "@/lib/ai-error-handling";



interface EditorPanelProps {
  resume: Resume;
  profile: Profile;
  job: Job | null;
  isLoadingJob: boolean;
  onResumeChange: (field: keyof Resume, value: Resume[keyof Resume]) => void;
}

export function EditorPanel({
  resume,
  profile,
  job,
  isLoadingJob,
  onResumeChange,
}: EditorPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showHumanScore, setShowHumanScore] = useState(false);
  const [humanScore, setHumanScore] = useState<number | null>(null);
  const [humanScoreFeedback, setHumanScoreFeedback] = useState<string[]>([]);
  const [humanScoreImprovements, setHumanScoreImprovements] = useState<string[]>([]);
  const [isAnalyzingHumanScore, setIsAnalyzingHumanScore] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });
  const [feedForwardMessage, setFeedForwardMessage] = useState<string | null>(null);

  const handleAnalyzeHumanScore = async () => {
    setIsAnalyzingHumanScore(true);
    try {
      // Serialize resume to text for analysis
      const resumeText = JSON.stringify({
        experience: resume.work_experience,
        projects: resume.projects,
        summary: resume.summary
      }, null, 2);

      const result = await analyzeHumanScore(resumeText);
      setHumanScore(result.score);
      setHumanScoreFeedback(result.feedback);
      setHumanScoreImprovements(result.improvements);
    } catch (error) {
      console.error("Failed to analyze human score:", error);
      const { title, description } = getUserFacingError(error);
      setErrorMessage({ title, description });
      setShowErrorDialog(true);
    } finally {
      setIsAnalyzingHumanScore(false);
    }
  };

  return (
    <div className="flex flex-col sm:mr-4 relative h-full max-h-full  ">
      <div className="flex-1 flex flex-col overflow-scroll">
        <ScrollArea className="flex-1 sm:pr-2" ref={scrollAreaRef}>
          <div className="relative pb-12">
            <div className={cn(
              "sticky top-0 z-20 backdrop-blur-sm",
              resume.is_base_resume
                ? "bg-purple-50/80"
                : "bg-pink-100/90 shadow-sm shadow-pink-200/50"
            )}>
              <div className="flex flex-col gap-4">
                <ResumeEditorActions
                  onResumeChange={onResumeChange}
                  job={job}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHumanScore(true)}
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Check Human Score
                </Button>
              </div>
            </div>


            {/* Tailored Job Accordion */}
            <Accordion type="single" collapsible defaultValue="basic" className="mt-6">
              <TailoredJobAccordion
                resume={resume}
                job={job}
                isLoading={isLoadingJob}
              />
            </Accordion>

            {/* Tabs */}
            <Tabs defaultValue="basic" className="mb-4">
              <ResumeEditorTabs />

              {/* Basic Info Form */}
              <TabsContent value="basic">
                <BasicInfoForm
                  profile={profile}
                />
              </TabsContent>

              {/* Work Experience Form */}
              <TabsContent value="work">
                <Suspense fallback={
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-muted rounded-md w-1/3" />
                    <div className="h-24 bg-muted rounded-md" />
                    <div className="h-24 bg-muted rounded-md" />
                  </div>
                }>
                  <WorkExperienceForm
                    experiences={resume.work_experience}
                    onChange={(experiences) => onResumeChange('work_experience', experiences)}
                    profile={profile}
                    targetRole={resume.target_role}
                  />
                </Suspense>
              </TabsContent>

              {/* Projects Form */}
              <TabsContent value="projects">
                <Suspense fallback={
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-muted rounded-md w-1/3" />
                    <div className="h-24 bg-muted rounded-md" />
                  </div>
                }>
                  <ProjectsForm
                    projects={resume.projects}
                    onChange={(projects) => onResumeChange('projects', projects)}
                    profile={profile}
                  />
                </Suspense>
              </TabsContent>

              {/* Education Form */}
              <TabsContent value="education">
                <Suspense fallback={
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-muted rounded-md w-1/3" />
                    <div className="h-24 bg-muted rounded-md" />
                  </div>
                }>
                  <EducationForm
                    education={resume.education}
                    onChange={(education) => onResumeChange('education', education)}
                    profile={profile}
                  />
                </Suspense>
              </TabsContent>

              {/* Skills Form */}
              <TabsContent value="skills">
                <Suspense fallback={
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-muted rounded-md w-1/3" />
                    <div className="h-24 bg-muted rounded-md" />
                  </div>
                }>
                  <SkillsForm
                    skills={resume.skills}
                    onChange={(skills) => onResumeChange('skills', skills)}
                    profile={profile}
                    jobKeywords={job?.keywords || []}
                    targetRole={resume.target_role || job?.position_title || ''}
                    jobDescription={job?.description || ''}
                  />
                </Suspense>
              </TabsContent>

              {/* Document Settings Form */}
              <TabsContent value="settings">
                <Suspense fallback={
                  <div className="space-y-4 animate-pulse">
                    <div className="h-8 bg-muted rounded-md w-1/3" />
                    <div className="h-24 bg-muted rounded-md" />
                  </div>
                }>
                  {/* Section Order */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Section Order & Style Presets</h3>
                    <SectionOrderForm
                      sectionOrder={resume.section_order || ['work_experience', 'education', 'skills', 'projects']}
                      sectionConfigs={resume.section_configs}
                      documentSettings={resume.document_settings}
                      customSections={resume.custom_sections}
                      onChange={onResumeChange}
                    />
                  </div>

                  {/* Custom Sections */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Sections</h3>
                    <CustomSectionsForm
                      customSections={resume.custom_sections || []}
                      onChange={(sections) => {
                        onResumeChange('custom_sections', sections);
                        // Add new custom section IDs to section_order
                        const currentOrder = resume.section_order || ['work_experience', 'education', 'skills', 'projects'];
                        const newIds = sections.map(s => s.id).filter(id => !currentOrder.includes(id));
                        if (newIds.length > 0) {
                          onResumeChange('section_order', [...currentOrder, ...newIds]);
                        }
                      }}
                    />
                  </div>

                  {/* Document Settings */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Settings</h3>
                    <DocumentSettingsForm
                      documentSettings={resume.document_settings!}
                      onChange={(_field: 'document_settings', value: DocumentSettings) => {
                        onResumeChange('document_settings', value);
                      }}
                    />
                  </div>
                </Suspense>
              </TabsContent>

              {/* Cover Letter Form */}
              <TabsContent value="cover-letter">
                <CoverLetterPanel
                  resume={resume}
                  job={job}
                />
              </TabsContent>


              {/* Resume Score Form */}
              <TabsContent value="resume-score">
                <ResumeScorePanel
                  resume={resume}
                  job={job}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      <div className={cn(
        "absolute w-full bottom-0 rounded-lg border",
        resume.is_base_resume
          ? "bg-purple-50/50 border-purple-200/40"
          : "bg-pink-50/80 border-pink-300/50 shadow-sm shadow-pink-200/20"
      )}>
        <ChatBot
          resume={resume}
          onResumeChange={onResumeChange}
          job={job}
          externalMessage={feedForwardMessage}
          onExternalMessageSent={() => setFeedForwardMessage(null)}
        />
      </div>

      <HumanScoreDialog
        open={showHumanScore}
        onOpenChange={setShowHumanScore}
        score={humanScore}
        feedback={humanScoreFeedback}
        improvements={humanScoreImprovements}
        isAnalyzing={isAnalyzingHumanScore}
        onAnalyze={handleAnalyzeHumanScore}
        onFeedForward={(improvements) => {
          const prompt = `Please improve my resume to sound more human and natural. Here are the specific improvements to make:\n\n${improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}\n\nUse the modifyWholeResume tool to apply these changes.`;
          setFeedForwardMessage(prompt);
        }}
      />

      <ApiErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        errorMessage={errorMessage}
        onUpgrade={() => {
          setShowErrorDialog(false);
          window.location.href = '/subscription';
        }}
        onSettings={() => {
          setShowErrorDialog(false);
          window.location.href = '/settings';
        }}
      />
    </div >
  );
} 