'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, User, AlertCircle, CheckCircle2, Wand2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HumanScoreDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    score: number | null;
    feedback: string[];
    improvements: string[];
    isAnalyzing: boolean;
    onAnalyze: () => void;
    onFeedForward?: (improvements: string[]) => void;
}

export function HumanScoreDialog({
    open,
    onOpenChange,
    score,
    feedback,
    improvements,
    isAnalyzing,
    onAnalyze,
    onFeedForward
}: HumanScoreDialogProps) {

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return "Great! Sounds natural.";
        if (score >= 50) return "Good, but could be more personal.";
        return "Sounds robotic or over-optimized.";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl text-slate-900">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <User className="h-6 w-6 text-purple-600" />
                        Human Score Check
                    </DialogTitle>
                    <DialogDescription>
                        Analyze your resume to ensure it sounds authentic and avoids &quot;robotic&quot; AI buzzwords.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!score && !isAnalyzing && (
                        <div className="text-center py-8 space-y-4">
                            <div className="bg-purple-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                <Brain className="h-8 w-8 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Ready to Analyze</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                    We&apos;ll check your resume for common AI patterns, buzzword stuffing, and lack of personal voice.
                                </p>
                            </div>
                            <Button onClick={onAnalyze} size="lg" className="mt-4 bg-purple-600 hover:bg-purple-700">
                                <Wand2 className="h-4 w-4 mr-2" />
                                Analyze My Resume
                            </Button>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="space-y-6 py-8">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Analyzing tone and voice...</span>
                                    <span>Please wait...</span>
                                </div>
                                <Progress value={undefined} className="h-2 w-full animate-pulse" />
                            </div>
                            <p className="text-center text-sm text-muted-foreground italic">
                                Looking for &quot;delve&quot;, &quot;spearheaded&quot;, and &quot;tapestry&quot;...
                            </p>
                        </div>
                    )}

                    {score !== null && !isAnalyzing && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Score Display */}
                            <div className="text-center space-y-2">
                                <div className={cn("text-5xl font-bold", getScoreColor(score))}>
                                    {score}/100
                                </div>
                                <p className="font-medium text-lg">{getScoreLabel(score)}</p>
                                <Progress
                                    value={score}
                                    className={cn("h-3 w-full mt-4",
                                        score >= 80 ? "bg-green-100" : score >= 50 ? "bg-yellow-100" : "bg-red-100"
                                    )}
                                    indicatorClassName={cn(
                                        score >= 80 ? "bg-green-600" : score >= 50 ? "bg-yellow-600" : "bg-red-600"
                                    )}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Feedback */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-slate-500" />
                                        Analysis
                                    </h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {feedback.map((item, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="text-purple-600">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        Improvements
                                    </h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {improvements.map((item, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="text-green-600">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {score !== null && onFeedForward && improvements.length > 0 && (
                        <Button
                            onClick={() => {
                                onFeedForward(improvements);
                                onOpenChange(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Apply Improvements
                        </Button>
                    )}
                    {score !== null && (
                        <Button variant="outline" onClick={onAnalyze} disabled={isAnalyzing}>
                            Re-Analyze
                        </Button>
                    )}
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
