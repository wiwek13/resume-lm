'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import { Resume } from '@/lib/types';
import { exportAsText, exportAsJson } from '@/utils/export/export-utils';
import { toast } from '@/hooks/use-toast';

interface ExportDropdownProps {
    resume: Resume;
    className?: string;
}

export function ExportDropdown({ resume, className }: ExportDropdownProps) {
    const [isExporting, setIsExporting] = useState(false);

    const getFilename = (extension: string) => {
        const baseName = resume.name || `${resume.first_name}_${resume.last_name}_Resume`;
        // Sanitize filename
        const sanitized = baseName.replace(/[^a-zA-Z0-9_\- ]/g, '_').replace(/\s+/g, '_');
        return `${sanitized}.${extension}`;
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportText = () => {
        try {
            setIsExporting(true);
            const content = exportAsText(resume);
            downloadFile(content, getFilename('txt'), 'text/plain');
            toast({
                title: 'Exported Successfully',
                description: 'Resume downloaded as plain text file.',
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export resume. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJson = () => {
        try {
            setIsExporting(true);
            const content = exportAsJson(resume);
            downloadFile(content, getFilename('json'), 'application/json');
            toast({
                title: 'Exported Successfully',
                description: 'Resume downloaded as JSON file.',
            });
        } catch (error) {
            console.error('Export error:', error);
            toast({
                title: 'Export Failed',
                description: 'Failed to export resume. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={className} disabled={isExporting}>
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportText} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Plain Text (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJson} className="cursor-pointer">
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-muted-foreground">
                    <FileText className="h-4 w-4 mr-2 opacity-50" />
                    DOCX (Coming Soon)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
