'use client';

import { Resume } from "@/lib/types";
import { Page as PDFPage, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { createResumeStyles } from '../pdf-styles';
import {
    HeaderSection,
    SummarySection,
    SkillsSection,
    ExperienceSection,
    ProjectsSection,
    EducationSection,
    CustomSectionComponent
} from '../pdf-components';

interface TemplateProps {
    resume: Resume;
    styles: ReturnType<typeof createResumeStyles>;
}

// Minimal overrides
const minimalStyles = StyleSheet.create({
    header: {
        marginBottom: 20,
        borderBottomWidth: 0,
    },
    sectionTitle: {
        borderBottomWidth: 0,
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 8,
        color: '#374151',
        textTransform: 'uppercase',
    }
});

export function MinimalTemplate({ resume, styles }: TemplateProps) {
    const sectionOrder = resume.section_order || ['work_experience', 'education', 'skills', 'projects'];

    const isSectionVisible = (sectionName: string) => {
        return resume.section_configs?.[sectionName]?.visible ?? true;
    };

    // Merge minimal overrides
    const combinedStyles = {
        ...styles,
        header: { ...styles.header, ...minimalStyles.header },
        sectionTitle: { ...styles.sectionTitle, ...minimalStyles.sectionTitle }
    };

    const renderSection = (sectionName: string) => {
        if (!isSectionVisible(sectionName)) return null;

        if (sectionName.startsWith('custom-')) {
            const customSection = resume.custom_sections?.find(s => s.id === sectionName);
            if (customSection) {
                return <CustomSectionComponent key={sectionName} section={customSection} styles={combinedStyles} />;
            }
            return null;
        }

        switch (sectionName) {
            case 'skills':
                return <SkillsSection key="skills" skills={resume.skills} styles={combinedStyles} />;
            case 'work_experience':
                return <ExperienceSection key="work_experience" experiences={resume.work_experience} styles={combinedStyles} />;
            case 'projects':
                return <ProjectsSection key="projects" projects={resume.projects} styles={combinedStyles} />;
            case 'education':
                return <EducationSection key="education" education={resume.education} styles={combinedStyles} />;
            default:
                return null;
        }
    };

    return (
        <PDFPage size="LETTER" style={styles.page}>
            <HeaderSection resume={resume} styles={combinedStyles} />
            <SummarySection summary={resume.summary} styles={combinedStyles} />
            {sectionOrder.map(renderSection)}

            {resume.document_settings?.show_ubc_footer && (
                <View style={styles.footer}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image
                        src="/images/ubc-science-footer.png"
                        style={styles.footerImage}
                    />
                </View>
            )}
        </PDFPage>
    );
}
