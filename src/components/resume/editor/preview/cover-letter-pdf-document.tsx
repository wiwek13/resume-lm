
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Resume, Job } from '@/lib/types';

// Register fonts
// Using standard fonts for reliability
// Font.register({
//     family: 'Inter',
//     fonts: [
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf', fontWeight: 400 },
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.ttf', fontWeight: 600 },
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.ttf', fontWeight: 700 },
//     ]
// });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.6,
        color: '#111827',
    },
    header: {
        marginBottom: 30,
    },
    date: {
        marginBottom: 20,
    },
    content: {
        marginBottom: 20,
    },
    paragraph: {
        marginBottom: 12,
        textAlign: 'justify'
    },
    signature: {
        marginTop: 40,
    }
});

interface CoverLetterPDFDocumentProps {
    resume: Resume;
    content: string;
}

// Simple HTML to ReactPDF parser
const HTMLTextRenderer = ({ html }: { html: string }) => {
    // 1. Remove any non-break/non-paragraph tags to sanitize
    // We keep <p> and <br>. Ideally, we'd handle <b> but for now let's keep it simple.

    // Split by paragraphs first
    const paragraphs = html.split(/<\/p>/i);

    return (
        <View>
            {paragraphs.map((para, i) => {
                // Clean paragraph tags
                const cleanPara = para.replace(/<p[^>]*>/gi, '').trim();
                if (!cleanPara) return null;

                // Handle line breaks
                const lines = cleanPara.split(/<br\s*\/?>/i);

                return (
                    <View key={i} style={styles.paragraph}>
                        {lines.map((line, j) => (
                            <Text key={j}>
                                {line.replace(/<[^>]+>/g, '')} {/* Strip remaining tags */}
                                {j < lines.length - 1 ? '\n' : ''}
                            </Text>
                        ))}
                    </View>
                );
            })}
        </View>
    );
};

export const CoverLetterPDFDocument = ({ resume, content }: CoverLetterPDFDocumentProps) => {
    return (
        <Document>
            <Page size="LETTER" style={styles.page}>
                <View style={styles.content}>
                    <HTMLTextRenderer html={content} />
                </View>
            </Page>
        </Document>
    );
};
