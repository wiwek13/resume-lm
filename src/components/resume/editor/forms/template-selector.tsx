'use client';

import { cn } from "@/lib/utils";
import { Check, Columns, FileText, LayoutTemplate, Layout } from "lucide-react";

export type TemplateId = 'modern' | 'professional' | 'minimal';

interface TemplateOption {
    id: TemplateId;
    name: string;
    description: string;
    icon: React.ElementType;
}

const TEMPLATES: TemplateOption[] = [
    {
        id: 'modern',
        name: 'Modern',
        description: 'Clean, single-column layout with subtle accents',
        icon: LayoutTemplate,
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'Traditional two-column layout optimized for density',
        icon: Columns,
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple, elegant typography with maximum whitespace',
        icon: FileText,
    }
];

interface TemplateSelectorProps {
    value: TemplateId;
    onChange: (value: TemplateId) => void;
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
    return (
        <div className="grid grid-cols-1 gap-2">
            {TEMPLATES.map((template) => (
                <button
                    key={template.id}
                    onClick={() => onChange(template.id)}
                    className={cn(
                        "relative flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all",
                        value === template.id
                            ? "border-purple-600 bg-purple-50 text-purple-900"
                            : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-md",
                        value === template.id ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                    )}>
                        <template.icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{template.description}</div>
                    </div>

                    {value === template.id && (
                        <div className="absolute right-3 top-3">
                            <Check className="h-4 w-4 text-purple-600" />
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
