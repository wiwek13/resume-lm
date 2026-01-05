import { Suspense } from 'react';
import { getJobListings } from '@/utils/actions/jobs/actions';
import { TrackerTable } from '@/components/tracker/tracker-table';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Application Tracker - ResumeLM',
    description: 'Track your job applications and status.',
};

export default async function TrackerPage() {
    const initialData = await getJobListings({ page: 1, pageSize: 50 }); // Fetch up to 50 active jobs

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-emerald-950">Application Tracker</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your job search and track application statuses.
                    </p>
                </div>
            </div>

            <Suspense fallback={<TrackerTableSkeleton />}>
                <TrackerTable jobs={initialData.jobs || []} />
            </Suspense>
        </div>
    );
}

function TrackerTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="border rounded-md p-4">
                <Skeleton className="h-8 w-full mb-4" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 py-4 border-b last:border-0">
                        <Skeleton className="h-10 w-1/4" />
                        <Skeleton className="h-10 w-1/4" />
                        <Skeleton className="h-10 w-1/4" />
                        <Skeleton className="h-10 w-1/4" />
                    </div>
                ))}
            </div>
        </div>
    );
}
