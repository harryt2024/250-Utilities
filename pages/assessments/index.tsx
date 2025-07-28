import { getSession, useSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { Role, AssessmentCohort, AssessmentType } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import { useState, FormEvent, useEffect } from 'react';
import UserLayout from '../../components/UserLayout'; // Use the main UserLayout
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CohortData = (AssessmentCohort & {
    _count: { assessments: number };
});

const assessmentTypeMap: Record<AssessmentType, string> = {
    BASIC_RADIO_OPERATOR: "Basic Radio Operator Award",
};

function CreateCohortModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: () => void }) {
    const [name, setName] = useState('');
    const [type, setType] = useState<AssessmentType | ''>('');
    const [instructorName, setInstructorName] = useState('');
    const [instructorSqn, setInstructorSqn] = useState('');
    const [assessorName, setAssessorName] = useState('');
    const [assessorSqn, setAssessorSqn] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setName(''); setType(''); setInstructorName(''); setInstructorSqn('');
            setAssessorName(''); setAssessorSqn(''); setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const response = await fetch('/api/assessments/cohorts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, instructorName, instructorSqn, assessorName, assessorSqn }),
        });
        if (response.ok) {
            onSave();
            onClose();
        } else {
            const data = await response.json();
            setError(data.message || 'Failed to create cohort.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold">Create New Assessment Cohort</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input type="text" placeholder="Cohort Name (e.g., 'BRO Course Aug 2025')" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <select value={type} onChange={e => setType(e.target.value as AssessmentType)} required className="w-full px-3 py-2 border rounded-md">
                        <option value="">Select Assessment Type</option>
                        {Object.entries(assessmentTypeMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Instructor Name" value={instructorName} onChange={e => setInstructorName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                        <input type="text" placeholder="Instructor Sqn" value={instructorSqn} onChange={e => setInstructorSqn(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Assessor Name" value={assessorName} onChange={e => setAssessorName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                        <input type="text" placeholder="Assessor Sqn" value={assessorSqn} onChange={e => setAssessorSqn(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">Create Cohort</button>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default function AssessmentPage() {
    const { data: session } = useSession();
    const { data: cohorts, error, isLoading } = useSWR<CohortData[]>('/api/assessments/cohorts', fetcher);
    const { mutate } = useSWRConfig();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isAdmin = session?.user?.role === Role.ADMIN;

    return (
        <UserLayout pageTitle="Assessment Cohorts">
            {isAdmin && (
                <CreateCohortModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => mutate('/api/assessments/cohorts')} />
            )}
            
            {/* Conditionally render the "Create" button for admins */}
            {isAdmin && (
                <div className="flex items-center justify-end pb-4 mb-4">
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">
                        Create New Cohort
                    </button>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cohort Name</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cadets</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Created On</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={5} className="py-4 text-center text-gray-500">Loading cohorts...</td></tr>}
                        {cohorts?.map(cohort => (
                            <tr key={cohort.id}>
                                <td className="px-6 py-4 font-medium whitespace-nowrap">{cohort.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{assessmentTypeMap[cohort.type]}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{cohort._count.assessments}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(cohort.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                    <Link href={`/assessments/${cohort.id}`} className="text-portal-blue hover:underline">
                                        View / Assess
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    // Any logged-in user can view this page
    if (!session) {
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }
    return { props: {} };
};
