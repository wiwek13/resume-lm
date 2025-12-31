'use client';

import { Skill, Profile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sparkles, Loader2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ImportFromProfileDialog } from "../../management/dialogs/import-from-profile-dialog";
import { useState, KeyboardEvent } from 'react';
import { enhanceSkills } from "@/utils/actions/resumes/ai";
import { toast } from "@/hooks/use-toast";
import { ApiErrorDialog } from "@/components/ui/api-error-dialog";
import { SkillEndorsementsDialog } from "../../shared/skill-endorsements-dialog";

interface SkillsFormProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
  profile: Profile;
  jobKeywords?: string[];
  targetRole?: string;
  jobDescription?: string;
}

export function SkillsForm({
  skills,
  onChange,
  profile,
  jobKeywords = [],
  targetRole = '',
  jobDescription = ''
}: SkillsFormProps) {
  const [newSkills, setNewSkills] = useState<{ [key: number]: string }>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });

  const addSkillCategory = () => {
    onChange([{
      category: "",
      items: []
    }, ...skills]);
  };

  const updateSkillCategory = (index: number, field: keyof Skill, value: string | string[]) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSkillCategory = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const addSkill = (categoryIndex: number) => {
    const skillToAdd = newSkills[categoryIndex]?.trim();
    if (!skillToAdd) return;

    const updated = [...skills];
    const currentItems = updated[categoryIndex].items || [];
    if (!currentItems.includes(skillToAdd)) {
      updated[categoryIndex] = {
        ...updated[categoryIndex],
        items: [...currentItems, skillToAdd]
      };
      onChange(updated);
    }
    setNewSkills({ ...newSkills, [categoryIndex]: '' });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>, categoryIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(categoryIndex);
    }
  };

  const removeSkill = (categoryIndex: number, skillIndex: number) => {
    const updated = skills.map((skill, idx) => {
      if (idx === categoryIndex) {
        return {
          ...skill,
          items: skill.items.filter((_, i) => i !== skillIndex)
        };
      }
      return skill;
    });
    onChange(updated);
  };

  const handleImportFromProfile = (importedSkills: Skill[]) => {
    onChange([...importedSkills, ...skills]);
  };

  const handleEnhanceSkills = async () => {
    if (skills.length === 0) {
      toast({
        title: "No skills to enhance",
        description: "Add some skills first before using AI enhancement.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);

    try {
      // Get model and API key from local storage
      const MODEL_STORAGE_KEY = 'resumelm-default-model';
      const LOCAL_STORAGE_KEY = 'resumelm-api-keys';

      const selectedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      const storedKeys = localStorage.getItem(LOCAL_STORAGE_KEY);
      let apiKeys = [];

      try {
        apiKeys = storedKeys ? JSON.parse(storedKeys) : [];
      } catch (error) {
        console.error('Error parsing API keys:', error);
      }

      const enhancedSkills = await enhanceSkills(
        skills,
        jobKeywords,
        targetRole,
        {
          model: selectedModel || '',
          apiKeys
        }
      );

      onChange(enhancedSkills);

      toast({
        title: "Skills Enhanced",
        description: "Your skills have been reorganized for better ATS matching.",
      });
    } catch (error: Error | unknown) {
      console.error('Failed to enhance skills:', error);
      if (error instanceof Error && (
        error.message.toLowerCase().includes('api key') ||
        error.message.toLowerCase().includes('unauthorized') ||
        error.message.toLowerCase().includes('invalid key'))
      ) {
        setErrorMessage({
          title: "API Key Error",
          description: "There was an issue with your API key. Please check your settings and try again."
        });
      } else {
        setErrorMessage({
          title: "Error",
          description: "Failed to enhance skills. Please try again."
        });
      }
      setShowErrorDialog(true);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <div className="@container">
          <div className={cn(
            "flex flex-col @[400px]:flex-row gap-2",
            "transition-all duration-300 ease-in-out"
          )}>
            <Button
              variant="outline"
              className={cn(
                "flex-1 h-9 min-w-[120px]",
                "bg-gradient-to-r from-rose-500/5 via-rose-500/10 to-pink-500/5",
                "hover:from-rose-500/10 hover:via-rose-500/15 hover:to-pink-500/10",
                "border-2 border-dashed border-rose-500/30 hover:border-rose-500/40",
                "text-rose-700 hover:text-rose-800",
                "transition-all duration-300",
                "rounded-xl",
                "whitespace-nowrap text-[11px] @[300px]:text-sm"
              )}
              onClick={addSkillCategory}
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              Add Category
            </Button>

            <ImportFromProfileDialog<Skill>
              profile={profile}
              onImport={handleImportFromProfile}
              type="skills"
              buttonClassName={cn(
                "flex-1 mb-0 h-9 min-w-[120px]",
                "whitespace-nowrap text-[11px] @[300px]:text-sm",
                "bg-gradient-to-r from-rose-500/5 via-rose-500/10 to-pink-500/5",
                "hover:from-rose-500/10 hover:via-rose-500/15 hover:to-pink-500/10",
                "border-2 border-dashed border-rose-500/30 hover:border-rose-500/40",
                "text-rose-700 hover:text-rose-800"
              )}
            />

            {/* AI-fy Skills Button */}
            <Button
              variant="outline"
              onClick={handleEnhanceSkills}
              disabled={isEnhancing || skills.length === 0}
              className={cn(
                "flex-1 h-9 min-w-[120px]",
                "bg-gradient-to-r from-purple-500/5 via-purple-500/10 to-indigo-500/5",
                "hover:from-purple-500/10 hover:via-purple-500/15 hover:to-indigo-500/10",
                "border-2 border-dashed border-purple-500/30 hover:border-purple-500/40",
                "text-purple-700 hover:text-purple-800",
                "transition-all duration-300",
                "rounded-xl",
                "whitespace-nowrap text-[11px] @[300px]:text-sm",
                "disabled:opacity-50"
              )}
            >
              {isEnhancing ? (
                <Loader2 className="h-4 w-4 mr-2 shrink-0 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2 shrink-0" />
              )}
              {isEnhancing ? 'Enhancing...' : 'AI-fy Skills'}
            </Button>

            {/* Skill Gaps Button */}
            <SkillEndorsementsDialog
              skills={skills}
              jobDescription={jobDescription}
              jobKeywords={jobKeywords}
              onAddSkill={(category, skill) => {
                // Find existing category or create new one
                const existingIdx = skills.findIndex(s => s.category.toLowerCase() === category.toLowerCase());
                if (existingIdx >= 0) {
                  const updated = [...skills];
                  if (!updated[existingIdx].items.includes(skill)) {
                    updated[existingIdx].items = [...updated[existingIdx].items, skill];
                    onChange(updated);
                  }
                } else {
                  onChange([...skills, { category, items: [skill] }]);
                }
              }}
            >
              <Button
                variant="outline"
                disabled={!jobDescription}
                className={cn(
                  "flex-1 h-9 min-w-[120px]",
                  "bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-orange-500/5",
                  "hover:from-amber-500/10 hover:via-amber-500/15 hover:to-orange-500/10",
                  "border-2 border-dashed border-amber-500/30 hover:border-amber-500/40",
                  "text-amber-700 hover:text-amber-800",
                  "transition-all duration-300",
                  "rounded-xl",
                  "whitespace-nowrap text-[11px] @[300px]:text-sm",
                  "disabled:opacity-50"
                )}
              >
                <Lightbulb className="h-4 w-4 mr-2 shrink-0" />
                Skill Gaps
              </Button>
            </SkillEndorsementsDialog>
          </div>
        </div>

        {skills.map((skill, index) => (
          <Card
            key={index}
            className={cn(
              "relative group transition-all duration-300",
              "bg-gradient-to-r from-rose-500/5 via-rose-500/10 to-pink-500/5",
              "backdrop-blur-md border-2 border-rose-500/30",
              "shadow-sm"
            )}
          >
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="space-y-2 sm:space-y-3">
                {/* Category Name and Delete Button Row */}
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <div className="relative group flex-1">
                    <Input
                      value={skill.category}
                      onChange={(e) => updateSkillCategory(index, 'category', e.target.value)}
                      className={cn(
                        "text-sm font-medium h-9",
                        "bg-white/50 border-gray-200 rounded-lg",
                        "focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/20",
                        "hover:border-rose-500/30 hover:bg-white/60 transition-colors",
                        "placeholder:text-gray-400"
                      )}
                      placeholder="Category Name"
                    />
                    <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-rose-700">
                      CATEGORY
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSkillCategory(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Skills Display */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {skill.items.map((item, skillIndex) => (
                      <Badge
                        key={skillIndex}
                        variant="secondary"
                        className={cn(
                          "bg-white/60 hover:bg-white/80 text-rose-700 border border-rose-200 py-0.5",
                          "transition-all duration-300 group/badge cursor-default text-[10px] sm:text-xs"
                        )}
                      >
                        {item}
                        <button
                          onClick={() => removeSkill(index, skillIndex)}
                          className="ml-1.5 hover:text-red-500 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* New Skill Input */}
                  <div className="relative group flex gap-2">
                    <Input
                      value={newSkills[index] || ''}
                      onChange={(e) => setNewSkills({ ...newSkills, [index]: e.target.value })}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      className={cn(
                        "h-9 bg-white/50 border-gray-200 rounded-lg",
                        "focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/20",
                        "hover:border-rose-500/30 hover:bg-white/60 transition-colors",
                        "placeholder:text-gray-400",
                        "text-[10px] sm:text-xs"
                      )}
                      placeholder="Type a skill and press Enter or click +"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSkill(index)}
                      className="h-9 px-2 bg-white/50 hover:bg-white/60"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <div className="absolute -top-2 left-2 px-1 bg-white/80 text-[7px] sm:text-[9px] font-medium text-rose-700">
                      ADD SKILL
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Dialog */}
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
    </>
  );
}  