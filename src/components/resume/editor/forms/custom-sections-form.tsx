'use client';

import { CustomSection, Resume } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useState, useCallback } from "react";
import Tiptap from "@/components/ui/tiptap";

interface CustomSectionsFormProps {
    customSections: CustomSection[];
    onChange: (sections: CustomSection[]) => void;
}

export function CustomSectionsForm({ customSections, onChange }: CustomSectionsFormProps) {
    const [newSectionTitle, setNewSectionTitle] = useState('');

    const addSection = useCallback(() => {
        if (!newSectionTitle.trim()) return;

        const newSection: CustomSection = {
            id: `custom-${Date.now()}`,
            title: newSectionTitle.trim(),
            items: [],
        };

        onChange([...customSections, newSection]);
        setNewSectionTitle('');
    }, [newSectionTitle, customSections, onChange]);

    const removeSection = useCallback((sectionId: string) => {
        onChange(customSections.filter(s => s.id !== sectionId));
    }, [customSections, onChange]);

    const updateSectionTitle = useCallback((sectionId: string, title: string) => {
        onChange(customSections.map(s =>
            s.id === sectionId ? { ...s, title } : s
        ));
    }, [customSections, onChange]);

    const addItem = useCallback((sectionId: string) => {
        onChange(customSections.map(s =>
            s.id === sectionId ? { ...s, items: [...s.items, ''] } : s
        ));
    }, [customSections, onChange]);

    const updateItem = useCallback((sectionId: string, itemIndex: number, value: string) => {
        onChange(customSections.map(s =>
            s.id === sectionId
                ? { ...s, items: s.items.map((item, i) => i === itemIndex ? value : item) }
                : s
        ));
    }, [customSections, onChange]);

    const removeItem = useCallback((sectionId: string, itemIndex: number) => {
        onChange(customSections.map(s =>
            s.id === sectionId
                ? { ...s, items: s.items.filter((_, i) => i !== itemIndex) }
                : s
        ));
    }, [customSections, onChange]);

    return (
        <div className="space-y-4">
            {/* Add new section */}
            <div className="flex gap-2">
                <Input
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="New section title (e.g., Certifications, Awards)"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && addSection()}
                />
                <Button
                    variant="outline"
                    onClick={addSection}
                    disabled={!newSectionTitle.trim()}
                    className={cn(
                        "bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-purple-500/5",
                        "hover:from-violet-500/10 hover:via-violet-500/15 hover:to-purple-500/10",
                        "border-2 border-dashed border-violet-500/30 hover:border-violet-500/40",
                        "text-violet-700 hover:text-violet-800"
                    )}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                </Button>
            </div>

            {/* Existing custom sections */}
            {customSections.map((section) => (
                <div
                    key={section.id}
                    className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        "bg-gradient-to-r from-violet-500/5 via-violet-500/10 to-purple-500/5",
                        "border-violet-500/30"
                    )}
                >
                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-3">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <Input
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                            className="flex-1 font-semibold"
                            placeholder="Section title"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSection(section.id)}
                            className="text-gray-400 hover:text-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 pl-8">
                        {section.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <Tiptap
                                        content={item}
                                        onChange={(value) => updateItem(section.id, itemIndex, value)}
                                        className={cn(
                                            "min-h-[40px] text-sm bg-white/50 border-gray-200 rounded-lg",
                                            "focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20"
                                        )}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(section.id, itemIndex)}
                                    className="text-gray-400 hover:text-red-500 mt-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addItem(section.id)}
                            className="text-violet-600 border-violet-200 hover:border-violet-300 hover:bg-violet-50/50"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                        </Button>
                    </div>
                </div>
            ))}

            {customSections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No custom sections yet. Add one above to include additional sections like Certifications, Awards, Publications, etc.
                </p>
            )}
        </div>
    );
}
