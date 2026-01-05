'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Job } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MoreHorizontal,
    ExternalLink,
    Briefcase,
    Calendar,
    Trash2,
    FileText
} from 'lucide-react';
import { updateJobStatus, deleteJob } from '@/utils/actions/jobs/actions';
import { toast } from 'sonner';

interface TrackerTableProps {
    jobs: Job[];
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    saved: 'secondary',
    applying: 'info',
    applied: 'default',
    interviewing: 'warning',
    offer: 'success',
    rejected: 'destructive',
};

const statusLabels: Record<string, string> = {
    saved: 'Saved',
    applying: 'Applying',
    applied: 'Applied',
    interviewing: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
};

export function TrackerTable({ jobs: initialJobs }: TrackerTableProps) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs);
    const router = useRouter();

    const handleStatusUpdate = async (jobId: string, newStatus: Job['status']) => {
        try {
            // Optimistic update
            setJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status: newStatus } : job
            ));

            await updateJobStatus(jobId, newStatus);
            toast.success('Status updated');
            router.refresh();
        } catch (error) {
            toast.error('Failed to update status');
            // Revert optimistic update
            router.refresh();
        }
    };

    const handleDelete = async (jobId: string) => {
        try {
            await deleteJob(jobId);
            setJobs(prev => prev.filter(job => job.id !== jobId));
            toast.success('Job deleted');
            router.refresh();
        } catch (error) {
            toast.error('Failed to delete job');
        }
    };

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
                <Briefcase className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No tracked jobs yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Add a job from the dashboard or "New Resume" flow to start tracking.
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company & Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{job.company_name || 'Untitled Company'}</span>
                                    <span className="text-sm text-muted-foreground">{job.position_title}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                                            <Badge variant={statusColors[job.status || 'saved'] as any || 'secondary'}>
                                                {statusLabels[job.status || 'saved']}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {Object.keys(statusLabels).map((status) => (
                                            <DropdownMenuItem
                                                key={status}
                                                onClick={() => handleStatusUpdate(job.id, status as Job['status'])}
                                            >
                                                <Badge variant={statusColors[status] as any} className="mr-2 w-2 h-2 rounded-full p-0" />
                                                {statusLabels[status]}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(job.created_at), 'MMM d, yyyy')}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {job.job_url && (
                                        <Button variant="ghost" size="icon" asChild title="View Job Post">
                                            <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="text-destructive font-medium" onClick={() => handleDelete(job.id)}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Job
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
