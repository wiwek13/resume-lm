import { Resume } from '@/lib/types';

/**
 * Export resume as plain text format
 */
export function exportAsText(resume: Resume): string {
    const lines: string[] = [];

    // Header
    lines.push(`${resume.first_name} ${resume.last_name}`.toUpperCase());
    lines.push('='.repeat(50));

    // Contact Info
    const contactParts: string[] = [];
    if (resume.email) contactParts.push(resume.email);
    if (resume.phone_number) contactParts.push(resume.phone_number);
    if (resume.location) contactParts.push(resume.location);
    if (contactParts.length > 0) {
        lines.push(contactParts.join(' | '));
    }

    const links: string[] = [];
    if (resume.linkedin_url) links.push(`LinkedIn: ${resume.linkedin_url}`);
    if (resume.github_url) links.push(`GitHub: ${resume.github_url}`);
    if (resume.website) links.push(`Website: ${resume.website}`);
    if (links.length > 0) {
        lines.push(links.join(' | '));
    }

    lines.push('');

    // Work Experience
    if (resume.work_experience && resume.work_experience.length > 0) {
        lines.push('WORK EXPERIENCE');
        lines.push('-'.repeat(50));

        resume.work_experience.forEach(exp => {
            lines.push(`${exp.position} at ${exp.company}`);
            if (exp.location) lines.push(`${exp.location}`);
            if (exp.date) lines.push(`${exp.date}`);
            lines.push('');

            exp.description?.forEach(bullet => {
                // Clean markdown formatting
                const cleanBullet = bullet.replace(/\*\*/g, '').replace(/\*/g, '');
                lines.push(`  • ${cleanBullet}`);
            });

            if (exp.technologies && exp.technologies.length > 0) {
                lines.push(`  Technologies: ${exp.technologies.join(', ')}`);
            }
            lines.push('');
        });
    }

    // Education
    if (resume.education && resume.education.length > 0) {
        lines.push('EDUCATION');
        lines.push('-'.repeat(50));

        resume.education.forEach(edu => {
            lines.push(`${edu.degree} in ${edu.field}`);
            lines.push(`${edu.school}`);
            if (edu.location) lines.push(`${edu.location}`);
            if (edu.date) lines.push(`${edu.date}`);
            if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
            lines.push('');
        });
    }

    // Skills
    if (resume.skills && resume.skills.length > 0) {
        lines.push('SKILLS');
        lines.push('-'.repeat(50));

        resume.skills.forEach(skillCat => {
            lines.push(`${skillCat.category}: ${skillCat.items.join(', ')}`);
        });
        lines.push('');
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
        lines.push('PROJECTS');
        lines.push('-'.repeat(50));

        resume.projects.forEach(proj => {
            lines.push(proj.name);
            if (proj.date) lines.push(proj.date);
            lines.push('');

            proj.description?.forEach(bullet => {
                const cleanBullet = bullet.replace(/\*\*/g, '').replace(/\*/g, '');
                lines.push(`  • ${cleanBullet}`);
            });

            if (proj.technologies && proj.technologies.length > 0) {
                lines.push(`  Technologies: ${proj.technologies.join(', ')}`);
            }
            lines.push('');
        });
    }

    return lines.join('\n');
}

/**
 * Export resume as JSON format
 */
export function exportAsJson(resume: Resume): string {
    // Clean up the resume object for export (remove internal fields)
    const exportData = {
        personal_info: {
            first_name: resume.first_name,
            last_name: resume.last_name,
            email: resume.email,
            phone_number: resume.phone_number,
            location: resume.location,
            website: resume.website,
            linkedin_url: resume.linkedin_url,
            github_url: resume.github_url,
        },
        target_role: resume.target_role,
        work_experience: resume.work_experience,
        education: resume.education,
        skills: resume.skills,
        projects: resume.projects,
        custom_sections: resume.custom_sections,
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Trigger download of a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
