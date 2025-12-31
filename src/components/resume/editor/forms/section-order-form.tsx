'use client';

import { Resume, DocumentSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, Save, Palette, Trash2 } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    getAllStylePresets,
    saveCustomStylePreset,
    deleteCustomStylePreset,
    StylePreset,
} from "@/lib/style-presets";

interface SectionOrderFormProps {
    sectionOrder: string[];
    sectionConfigs: Resume['section_configs'];
    documentSettings?: DocumentSettings;
    customSections?: Array<{ id: string; title: string; items: string[] }>;
    onChange: (field: keyof Resume, value: Resume[keyof Resume]) => void;
}

const SECTION_LABELS: Record<string, string> = {
    skills: 'Skills',
    work_experience: 'Work Experience',
    projects: 'Projects',
    education: 'Education',
};

// Get label for any section (built-in or custom)
const getSectionLabel = (sectionKey: string, customSections?: Array<{ id: string; title: string }>) => {
    if (SECTION_LABELS[sectionKey]) return SECTION_LABELS[sectionKey];
    const custom = customSections?.find(s => s.id === sectionKey);
    return custom?.title || sectionKey;
};

const DEFAULT_SECTIONS = ['work_experience', 'education', 'skills', 'projects'];

export function SectionOrderForm({
    sectionOrder,
    sectionConfigs,
    documentSettings,
    customSections,
    onChange
}: SectionOrderFormProps) {
    const [presets, setPresets] = useState<StylePreset[]>([]);
    const [newPresetName, setNewPresetName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    // Load presets on mount
    useEffect(() => {
        setPresets(getAllStylePresets());
    }, []);

    // Use default order if none specified
    const currentOrder = sectionOrder?.length ? sectionOrder : DEFAULT_SECTIONS;

    const moveSection = useCallback((index: number, direction: 'up' | 'down') => {
        const newOrder = [...currentOrder];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        // Swap positions
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        onChange('section_order', newOrder);
    }, [currentOrder, onChange]);

    const toggleVisibility = useCallback((sectionKey: string) => {
        const currentConfigs = sectionConfigs || {};
        const currentVisible = currentConfigs[sectionKey]?.visible ?? true;

        onChange('section_configs', {
            ...currentConfigs,
            [sectionKey]: {
                ...currentConfigs[sectionKey],
                visible: !currentVisible
            }
        });
    }, [sectionConfigs, onChange]);

    const isVisible = (sectionKey: string) => {
        return sectionConfigs?.[sectionKey]?.visible ?? true;
    };

    const handleLoadPreset = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (!preset) return;

        // Apply preset settings
        onChange('section_order', preset.section_order);
        onChange('document_settings', preset.document_settings);
    };

    const handleSavePreset = () => {
        if (!newPresetName.trim() || !documentSettings) return;

        const newPreset = saveCustomStylePreset({
            name: newPresetName.trim(),
            section_order: currentOrder,
            document_settings: documentSettings,
        });

        setPresets([...presets, newPreset]);
        setNewPresetName('');
        setShowSaveInput(false);
    };

    const handleDeletePreset = (presetId: string) => {
        deleteCustomStylePreset(presetId);
        setPresets(presets.filter(p => p.id !== presetId));
    };

    return (
        <div className="space-y-4">
            {/* Style Presets */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Style Presets</span>
                </div>

                <div className="flex gap-2">
                    <Select onValueChange={handleLoadPreset}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Load a style preset..." />
                        </SelectTrigger>
                        <SelectContent>
                            {presets.map(preset => (
                                <SelectItem key={preset.id} value={preset.id}>
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <span>{preset.name}</span>
                                        {preset.isBuiltIn && (
                                            <span className="text-xs text-muted-foreground">(Built-in)</span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {!showSaveInput ? (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowSaveInput(true)}
                            className="shrink-0"
                            title="Save current settings as preset"
                        >
                            <Save className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex gap-1">
                            <Input
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder="Preset name..."
                                className="w-32"
                                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                            />
                            <Button
                                variant="default"
                                size="icon"
                                onClick={handleSavePreset}
                                disabled={!newPresetName.trim()}
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Custom presets management */}
                {presets.filter(p => !p.isBuiltIn).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {presets.filter(p => !p.isBuiltIn).map(preset => (
                            <div
                                key={preset.id}
                                className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-md text-xs"
                            >
                                <span>{preset.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 text-gray-400 hover:text-red-500"
                                    onClick={() => handleDeletePreset(preset.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-3">
                    Reorder sections or hide them from your resume PDF.
                </p>
            </div>

            <div className="space-y-2">
                {currentOrder.map((sectionKey, index) => (
                    <div
                        key={sectionKey}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                            isVisible(sectionKey)
                                ? "bg-white/50 border-purple-200/50 hover:border-purple-300/60"
                                : "bg-gray-100/50 border-gray-200/50 opacity-60"
                        )}
                    >
                        {/* Drag handle indicator */}
                        <div className="text-gray-400">
                            <GripVertical className="h-5 w-5" />
                        </div>

                        {/* Section name */}
                        <div className="flex-1 font-medium flex items-center gap-2">
                            {getSectionLabel(sectionKey, customSections)}
                            {sectionKey.startsWith('custom-') && (
                                <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded">Custom</span>
                            )}
                        </div>

                        {/* Move buttons */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-purple-600"
                                onClick={() => moveSection(index, 'up')}
                                disabled={index === 0}
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-purple-600"
                                onClick={() => moveSection(index, 'down')}
                                disabled={index === currentOrder.length - 1}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Visibility toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 transition-colors",
                                isVisible(sectionKey)
                                    ? "text-purple-600 hover:text-purple-700"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                            onClick={() => toggleVisibility(sectionKey)}
                        >
                            {isVisible(sectionKey) ? (
                                <Eye className="h-4 w-4" />
                            ) : (
                                <EyeOff className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="pt-2 text-xs text-muted-foreground">
                <p>Tip: Hidden sections won&apos;t appear in your PDF but their content is preserved.</p>
            </div>
        </div>
    );
}
