'use client';

import { useState, useEffect } from 'react';
import { Resume, ResumeSummary } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCompare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ResumeCompareDialogProps {
    currentResume: Resume;
    resumes?: ResumeSummary[];
    children?: React.ReactNode;
}

interface ComparisonSection {
    title: string;
    current: string[];
    compare: string[];
}

export function ResumeCompareDialog({ currentResume, resumes: providedResumes, children }: ResumeCompareDialogProps) {
    const [open, setOpen] = useState(false);
    const [resumes, setResumes] = useState<ResumeSummary[]>(providedResumes || []);
    const [selectedResumeId, setSelectedResumeId] = useState<string>('');
    const [compareResume, setCompareResume] = useState<Resume | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);

    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch resumes when dialog opens if not provided
    useEffect(() => {
        if (open && resumes.length === 0 && !providedResumes) {
            const fetchResumes = async () => {
                setIsLoadingResumes(true);
                setFetchError(null);
                try {
                    const supabase = createClient();
                    const { data, error } = await supabase
                        .from('resumes')
                        .select('id, name, is_base_resume, created_at')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setResumes(data as ResumeSummary[]);
                } catch (error) {
                    console.error('Failed to load resumes:', error);
                    setFetchError('Failed to load resumes. Please check your connection and try again.');
                } finally {
                    setIsLoadingResumes(false);
                }
            };
            fetchResumes();
        }
    }, [open, resumes.length, providedResumes]);
    useEffect(() => {
        if (!selectedResumeId || selectedResumeId === currentResume.id) {
            setCompareResume(null);
            return;
        }

        const loadResume = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('resumes')
                    .select('*')
                    .eq('id', selectedResumeId)
                    .single();

                if (error) throw error;
                setCompareResume(data as Resume);
            } catch (error) {
                console.error('Failed to load resume:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadResume();
    }, [selectedResumeId, currentResume.id]);

    // Compare skills
    const compareSkills = (): { added: string[]; removed: string[]; same: string[] } => {
        if (!compareResume) return { added: [], removed: [], same: [] };

        const currentSkills = new Set(currentResume.skills.flatMap(s => s.items));
        const compareSkills = new Set(compareResume.skills.flatMap(s => s.items));

        const added = [...currentSkills].filter(s => !compareSkills.has(s));
        const removed = [...compareSkills].filter(s => !currentSkills.has(s));
        const same = [...currentSkills].filter(s => compareSkills.has(s));

        return { added, removed, same };
    };

    // Compare work experience
    const compareWorkExperience = (): ComparisonSection[] => {
        if (!compareResume) return [];

        const sections: ComparisonSection[] = [];
        const maxLen = Math.max(
            currentResume.work_experience.length,
            compareResume.work_experience.length
        );

        for (let i = 0; i < maxLen; i++) {
            const current = currentResume.work_experience[i];
            const compare = compareResume.work_experience[i];

            sections.push({
                title: current?.company || compare?.company || `Experience ${i + 1}`,
                current: current?.description || [],
                compare: compare?.description || []
            });
        }

        return sections;
    };

    const skillsDiff = compareSkills();
    const expComparison = compareWorkExperience();

    // Filter out current resume from options
    const availableResumes = resumes.filter(r => r.id !== currentResume.id);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <GitCompare className="h-4 w-4 mr-2" />
                        Compare
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5 text-purple-600" />
                        Compare Resumes
                    </DialogTitle>
                </DialogHeader>

                {/* Error State */}
                {fetchError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                        {fetchError}
                    </div>
                )}

                {/* Resume Selector */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Current Resume</div>
                        <div className="font-medium text-sm truncate">{currentResume.name}</div>
                    </div>
                    <div className="text-gray-400">vs</div>
                    <div className="flex-1">
                        {isLoadingResumes ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading resumes...
                            </div>
                        ) : availableResumes.length === 0 ? (
                            <div className="text-sm text-gray-400 italic">
                                No other resumes to compare
                            </div>
                        ) : (
                            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select resume to compare" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableResumes.map(resume => (
                                        <SelectItem key={resume.id} value={resume.id}>
                                            {resume.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Comparison Content */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                ) : compareResume ? (
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-6">
                            {/* Skills Comparison */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm">Skills Comparison</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-green-600">Added in Current</div>
                                        <div className="flex flex-wrap gap-1">
                                            {skillsDiff.added.length > 0 ? skillsDiff.added.map((skill, i) => (
                                                <Badge key={i} className="bg-green-100 text-green-700 text-xs">
                                                    + {skill}
                                                </Badge>
                                            )) : <span className="text-xs text-gray-400">None</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-red-600">Removed from Current</div>
                                        <div className="flex flex-wrap gap-1">
                                            {skillsDiff.removed.length > 0 ? skillsDiff.removed.map((skill, i) => (
                                                <Badge key={i} className="bg-red-100 text-red-700 text-xs">
                                                    - {skill}
                                                </Badge>
                                            )) : <span className="text-xs text-gray-400">None</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-gray-600">Unchanged</div>
                                        <div className="flex flex-wrap gap-1">
                                            {skillsDiff.same.slice(0, 10).map((skill, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {skillsDiff.same.length > 10 && (
                                                <span className="text-xs text-gray-400">+{skillsDiff.same.length - 10} more</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Work Experience Comparison */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm">Work Experience Comparison</h3>
                                {expComparison.map((section, idx) => (
                                    <div key={idx} className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 px-3 py-2 font-medium text-sm">
                                            {section.title}
                                        </div>
                                        <div className="grid grid-cols-2 divide-x">
                                            <div className="p-3 space-y-2">
                                                <div className="text-xs font-medium text-purple-600">Current</div>
                                                {section.current.length > 0 ? section.current.map((bullet, i) => (
                                                    <div key={i} className={cn(
                                                        "text-xs p-2 rounded",
                                                        !section.compare.includes(bullet)
                                                            ? "bg-green-50 border-l-2 border-green-500"
                                                            : "bg-gray-50"
                                                    )}>
                                                        {bullet.replace(/\*\*/g, '')}
                                                    </div>
                                                )) : <div className="text-xs text-gray-400 italic">No content</div>}
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <div className="text-xs font-medium text-pink-600">Compare</div>
                                                {section.compare.length > 0 ? section.compare.map((bullet, i) => (
                                                    <div key={i} className={cn(
                                                        "text-xs p-2 rounded",
                                                        !section.current.includes(bullet)
                                                            ? "bg-red-50 border-l-2 border-red-500"
                                                            : "bg-gray-50"
                                                    )}>
                                                        {bullet.replace(/\*\*/g, '')}
                                                    </div>
                                                )) : <div className="text-xs text-gray-400 italic">No content</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {currentResume.work_experience.length}
                                    </div>
                                    <div className="text-xs text-gray-600">Experiences</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        +{skillsDiff.added.length}
                                    </div>
                                    <div className="text-xs text-gray-600">Skills Added</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">
                                        -{skillsDiff.removed.length}
                                    </div>
                                    <div className="text-xs text-gray-600">Skills Removed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {currentResume.skills.flatMap(s => s.items).length}
                                    </div>
                                    <div className="text-xs text-gray-600">Total Skills</div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <GitCompare className="h-12 w-12 text-gray-300 mb-4" />
                        <div className="text-gray-500">Select a resume to compare</div>
                        <div className="text-xs text-gray-400 mt-1">
                            See what&apos;s different between two versions
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
