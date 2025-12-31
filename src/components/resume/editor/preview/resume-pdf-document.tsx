'use client';

import { Resume } from "@/lib/types";
import { Document as PDFDocument } from '@react-pdf/renderer';
import { memo, useMemo } from 'react';
import { createResumeStyles } from './pdf-styles';
import { ModernTemplate } from './templates/modern-template';
import { MinimalTemplate } from './templates/minimal-template';
import { ProfessionalTemplate } from './templates/professional-template';

interface ResumePDFDocumentProps {
  resume: Resume;
  variant?: 'base' | 'tailored';
}

export const ResumePDFDocument = memo(function ResumePDFDocument({ resume }: ResumePDFDocumentProps) {
  // Memoize styles based on document settings
  const styles = useMemo(() => createResumeStyles(resume.document_settings), [resume.document_settings]);

  const template = resume.document_settings?.template || 'modern';

  const renderTemplate = () => {
    switch (template) {
      case 'minimal':
        return <MinimalTemplate resume={resume} styles={styles} />;
      case 'professional':
        return <ProfessionalTemplate resume={resume} styles={styles} />;
      case 'modern':
      default:
        return <ModernTemplate resume={resume} styles={styles} />;
    }
  };

  return (
    <PDFDocument>
      {renderTemplate()}
    </PDFDocument>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.resume === nextProps.resume &&
    prevProps.variant === nextProps.variant
  );
});
 
