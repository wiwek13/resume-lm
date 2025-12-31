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

// Professional overrides - Two Column Layout
const professionalStyles = StyleSheet.create({
    page: {
        flexDirection: 'column',
    },
    columns: {
        flexDirection: 'row',
        flex: 1,
        marginTop: 10,
    },
    leftColumn: {
        width: '30%',
        paddingRight: 10,
        borderRight: '1pt solid #e5e7eb',
    },
    rightColumn: {
        width: '70%',
        paddingLeft: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 2,
        textTransform: 'uppercase',
    }
});

export function ProfessionalTemplate({ resume, styles }: TemplateProps) {
    const sectionOrder = resume.section_order || ['work_experience', 'education', 'skills', 'projects'];

    const isSectionVisible = (sectionName: string) => {
        return resume.section_configs?.[sectionName]?.visible ?? true;
    };

    // Merge professional overrides
    const combinedStyles = {
        ...styles,
        sectionTitle: { ...styles.sectionTitle, ...professionalStyles.sectionTitle }
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

    // Separate sections for columns
    const leftColumnSections = ['education', 'skills'];
    const rightColumnSections = ['work_experience', 'projects'];

    // Custom logic to distribute custom sections or stick to user order if desired
    // For Professional template, we enforce a specific two-column structure for standard sections
    // but let user order determine vertical order within columns if possible.
    // Ideally, professional template handles structure differently.

    const RenderColumn = ({ sections }: { sections: string[] }) => (
        <>
            {sections.map(name => {
                // Check if it's in the user's enabled list (ignoring order for column assignment)
                if (!sectionOrder.includes(name) && !name.startsWith('custom-')) return null;
                return renderSection(name);
            })}
        </>
    );

    return (
        <PDFPage size="LETTER" style={styles.page}>
            <HeaderSection resume={resume} styles={combinedStyles} />
            <SummarySection summary={resume.summary} styles={combinedStyles} />

            <View style={professionalStyles.columns}>
                <View style={professionalStyles.leftColumn}>
                    <RenderColumn sections={['education', 'skills']} />
                    {/* Render custom sections in left column if small? For now put them in right */}
                </View>

                <View style={professionalStyles.rightColumn}>
                    <RenderColumn sections={['work_experience', 'projects']} />
                    {/* Render all custom sections here for now */}
                    {sectionOrder
                        .filter(s => s.startsWith('custom-'))
                        .map(renderSection)}
                </View>
            </View>

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
