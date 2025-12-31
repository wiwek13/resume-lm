'use client';

import { Resume } from "@/lib/types";
import { Document as PDFDocument, Page as PDFPage, View, Image } from '@react-pdf/renderer';
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

export function ModernTemplate({ resume, styles }: TemplateProps) {
    // Default section order if not specified
    const sectionOrder = resume.section_order || ['work_experience', 'education', 'skills', 'projects'];

    // Check if section is visible
    const isSectionVisible = (sectionName: string) => {
        return resume.section_configs?.[sectionName]?.visible ?? true;
    };

    const renderSection = (sectionName: string) => {
        if (!isSectionVisible(sectionName)) return null;

        if (sectionName.startsWith('custom-')) {
            const customSection = resume.custom_sections?.find(s => s.id === sectionName);
            if (customSection) {
                return <CustomSectionComponent key={sectionName} section={customSection} styles={styles} />;
            }
            return null;
        }

        switch (sectionName) {
            case 'skills':
                return <SkillsSection key="skills" skills={resume.skills} styles={styles} />;
            case 'work_experience':
                return <ExperienceSection key="work_experience" experiences={resume.work_experience} styles={styles} />;
            case 'projects':
                return <ProjectsSection key="projects" projects={resume.projects} styles={styles} />;
            case 'education':
                return <EducationSection key="education" education={resume.education} styles={styles} />;
            default:
                return null;
        }
    };

    return (
        <PDFPage size="LETTER" style={styles.page}>
            <HeaderSection resume={resume} styles={styles} />
            <SummarySection summary={resume.summary} styles={styles} />
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
