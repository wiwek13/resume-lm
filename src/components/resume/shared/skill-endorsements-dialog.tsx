'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skill } from '@/lib/types';
import { suggestMissingSkills } from '@/utils/actions/resumes/ai';
import { Loader2, Sparkles, Plus, Check, X, AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ApiErrorDialog } from '@/components/ui/api-error-dialog';
import { getUserFacingError } from '@/lib/ai-error-handling';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface SkillSuggestion {
    category: string;
    skill: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
}

interface SkillEndorsementsDialogProps {
    skills: Skill[];
    jobDescription: string;
    jobKeywords: string[];
    onAddSkill: (category: string, skill: string) => void;
    children?: React.ReactNode;
}

export function SkillEndorsementsDialog({
    skills,
    jobDescription,
    jobKeywords,
    onAddSkill,
    children
}: SkillEndorsementsDialogProps) {
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });

    const fetchSuggestions = async () => {
        if (suggestions.length > 0) return; // Already loaded

        setIsLoading(true);
        try {
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

            const result = await suggestMissingSkills(
                skills,
                jobDescription,
                jobKeywords,
                {
                    model: selectedModel || '',
                    apiKeys
                }
            );

            setSuggestions(result);
        } catch (error: any) {
            console.error('Failed to get skill suggestions:', error);
            const { title, description } = getUserFacingError(error);
            setErrorMessage({ title, description });
            setShowErrorDialog(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSkill = (suggestion: SkillSuggestion) => {
        onAddSkill(suggestion.category, suggestion.skill);
        setAddedSkills(prev => new Set([...prev, suggestion.skill]));
        toast({
            title: "Skill Added",
            description: `"${suggestion.skill}" added to ${suggestion.category}`,
        });
    };

    const handleAddAll = () => {
        const unadded = suggestions.filter(s => !addedSkills.has(s.skill));
        unadded.forEach(s => {
            onAddSkill(s.category, s.skill);
        });
        setAddedSkills(new Set(suggestions.map(s => s.skill)));
        toast({
            title: "All Skills Added",
            description: `Added ${unadded.length} skills to your resume`,
        });
    };

    const priorityConfig = {
        high: { color: 'bg-red-100 text-red-700 border-red-200', icon: '🔥', label: 'Required' },
        medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⭐', label: 'Preferred' },
        low: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '💡', label: 'Nice to have' }
    };

    // Group suggestions by category
    const groupedSuggestions = suggestions.reduce((acc, s) => {
        if (!acc[s.category]) acc[s.category] = [];
        acc[s.category].push(s);
        return acc;
    }, {} as Record<string, SkillSuggestion[]>);

    const unaddedCount = suggestions.filter(s => !addedSkills.has(s.skill)).length;

    return (
        <>
            <Dialog open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (isOpen) fetchSuggestions();
            }}>
                <DialogTrigger asChild>
                    {children || (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!jobDescription}
                            className={cn(
                                "text-amber-600 border-amber-200",
                                "hover:bg-amber-50 hover:border-amber-300",
                                "disabled:opacity-50"
                            )}
                        >
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Skill Gaps
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-amber-500" />
                            Missing Skills from Job Description
                        </DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
                            <div className="text-sm text-gray-500">Analyzing job description...</div>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Check className="h-12 w-12 text-green-500 mb-4" />
                            <div className="font-medium text-green-700">Great job!</div>
                            <div className="text-sm text-gray-500 mt-1">
                                Your resume already covers all key skills from the job description.
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Header with Add All */}
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <span className="text-sm text-amber-700">
                                        Found <strong>{suggestions.length}</strong> skills you might want to add
                                    </span>
                                </div>
                                {unaddedCount > 0 && (
                                    <Button
                                        size="sm"
                                        onClick={handleAddAll}
                                        className="bg-amber-500 hover:bg-amber-600 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add All
                                    </Button>
                                )}
                            </div>

                            {/* Grouped Suggestions */}
                            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
                                {Object.entries(groupedSuggestions).map(([category, categorySkills]) => (
                                    <div key={category} className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 px-3 py-2 font-medium text-sm flex items-center justify-between">
                                            <span>{category}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {categorySkills.length} skills
                                            </Badge>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            {categorySkills.map((suggestion, idx) => {
                                                const isAdded = addedSkills.has(suggestion.skill);
                                                const config = priorityConfig[suggestion.priority];

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-lg transition-all",
                                                            isAdded
                                                                ? "bg-green-50 border border-green-200"
                                                                : "bg-gray-50 hover:bg-gray-100"
                                                        )}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-sm">{suggestion.skill}</span>
                                                                <Badge className={cn("text-[10px] px-1.5", config.color)}>
                                                                    {config.icon} {config.label}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {suggestion.reason}
                                                            </div>
                                                        </div>
                                                        {isAdded ? (
                                                            <div className="flex items-center gap-1 text-green-600 text-xs">
                                                                <Check className="h-4 w-4" />
                                                                Added
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleAddSkill(suggestion)}
                                                                className="h-8 text-xs"
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="text-xs text-center text-gray-400 pt-2">
                                💡 Only add skills you genuinely have experience with
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
