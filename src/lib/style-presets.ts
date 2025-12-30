import { DocumentSettings } from "@/lib/types";

export interface StylePreset {
    id: string;
    name: string;
    section_order: string[];
    document_settings: DocumentSettings;
    isBuiltIn?: boolean;
}

const STYLE_PRESETS_STORAGE_KEY = 'resumelm-style-presets';

// Built-in style presets
export const BUILT_IN_PRESETS: StylePreset[] = [
    {
        id: 'classic',
        name: 'Classic',
        isBuiltIn: true,
        section_order: ['work_experience', 'education', 'skills', 'projects'],
        document_settings: {
            document_font_size: 10,
            document_line_height: 1.5,
            document_margin_vertical: 36,
            document_margin_horizontal: 36,
            header_name_size: 24,
            header_name_bottom_spacing: 16,
            skills_margin_top: 4,
            skills_margin_bottom: 4,
            skills_margin_horizontal: 0,
            skills_item_spacing: 2,
            experience_margin_top: 4,
            experience_margin_bottom: 4,
            experience_margin_horizontal: 0,
            experience_item_spacing: 4,
            projects_margin_top: 4,
            projects_margin_bottom: 4,
            projects_margin_horizontal: 0,
            projects_item_spacing: 4,
            education_margin_top: 4,
            education_margin_bottom: 4,
            education_margin_horizontal: 0,
            education_item_spacing: 4,
        }
    },
    {
        id: 'modern',
        name: 'Modern Compact',
        isBuiltIn: true,
        section_order: ['skills', 'work_experience', 'projects', 'education'],
        document_settings: {
            document_font_size: 9,
            document_line_height: 1.3,
            document_margin_vertical: 28,
            document_margin_horizontal: 28,
            header_name_size: 20,
            header_name_bottom_spacing: 12,
            skills_margin_top: 2,
            skills_margin_bottom: 2,
            skills_margin_horizontal: 0,
            skills_item_spacing: 1,
            experience_margin_top: 2,
            experience_margin_bottom: 2,
            experience_margin_horizontal: 0,
            experience_item_spacing: 2,
            projects_margin_top: 2,
            projects_margin_bottom: 2,
            projects_margin_horizontal: 0,
            projects_item_spacing: 2,
            education_margin_top: 2,
            education_margin_bottom: 2,
            education_margin_horizontal: 0,
            education_item_spacing: 2,
        }
    },
    {
        id: 'garamond',
        name: 'Classic Garamond',
        isBuiltIn: true,
        section_order: ['work_experience', 'education', 'projects', 'skills'],
        document_settings: {
            document_font_size: 11,
            document_line_height: 1.4,
            document_margin_vertical: 40,
            document_margin_horizontal: 40,
            header_name_size: 28,
            header_name_bottom_spacing: 20,
            skills_margin_top: 6,
            skills_margin_bottom: 6,
            skills_margin_horizontal: 0,
            skills_item_spacing: 3,
            experience_margin_top: 6,
            experience_margin_bottom: 6,
            experience_margin_horizontal: 0,
            experience_item_spacing: 5,
            projects_margin_top: 6,
            projects_margin_bottom: 6,
            projects_margin_horizontal: 0,
            projects_item_spacing: 5,
            education_margin_top: 6,
            education_margin_bottom: 6,
            education_margin_horizontal: 0,
            education_item_spacing: 5,
        }
    },
];

// Get all style presets (built-in + custom)
export function getAllStylePresets(): StylePreset[] {
    const customPresets = getCustomStylePresets();
    return [...BUILT_IN_PRESETS, ...customPresets];
}

// Get custom style presets from localStorage
export function getCustomStylePresets(): StylePreset[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STYLE_PRESETS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Save a new custom style preset
export function saveCustomStylePreset(preset: Omit<StylePreset, 'id' | 'isBuiltIn'>): StylePreset {
    const customPresets = getCustomStylePresets();

    const newPreset: StylePreset = {
        ...preset,
        id: `custom-${Date.now()}`,
        isBuiltIn: false,
    };

    const updatedPresets = [...customPresets, newPreset];

    if (typeof window !== 'undefined') {
        localStorage.setItem(STYLE_PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    }

    return newPreset;
}

// Delete a custom style preset
export function deleteCustomStylePreset(id: string): void {
    const customPresets = getCustomStylePresets();
    const filtered = customPresets.filter(p => p.id !== id);

    if (typeof window !== 'undefined') {
        localStorage.setItem(STYLE_PRESETS_STORAGE_KEY, JSON.stringify(filtered));
    }
}

// Get a preset by ID
export function getStylePresetById(id: string): StylePreset | undefined {
    return getAllStylePresets().find(p => p.id === id);
}
