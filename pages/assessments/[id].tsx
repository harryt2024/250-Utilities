import { getSession, useSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { Role, AssessmentCohort, RadioAssessment, Cadet } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import { useState, FormEvent, useEffect, useRef } from 'react';
import UserLayout from '../../components/UserLayout'; // Use UserLayout for all users
import Link from 'next/link';
import { useRouter } from 'next/router';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CohortDetails = (AssessmentCohort & {
    assessments: (RadioAssessment & { cadet: Cadet })[];
});

// --- AddCadetModal ---
function AddCadetModal({ isOpen, onClose, onSave, cohortId }: { isOpen: boolean, onClose: () => void, onSave: () => void, cohortId: string }) {
    const [sqn, setSqn] = useState('');
    const [rank, setRank] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rankInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (isOpen) { setSqn(''); setRank(''); setFullName(''); setError(null); setSuccess(null); } }, [isOpen]);
    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        const res = await fetch(`/api/assessments/${cohortId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sqn, rank, fullName }),
        });

        if (res.ok) { 
            onSave(); 
            setSuccess(`Added ${fullName}.`);
            // Reset for next entry
            setRank('');
            setFullName('');
            rankInputRef.current?.focus();
        } else { 
            setError('Failed to add cadet.'); 
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold">Add Cadets to Cohort</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input type="text" placeholder="Squadron (will be remembered)" value={sqn} onChange={e => setSqn(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <div className="grid grid-cols-2 gap-4">
                        <input ref={rankInputRef} type="text" placeholder="Rank" value={rank} onChange={e => setRank(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                        <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md">Close</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue">
                            {isSubmitting ? 'Adding...' : 'Add Cadet'}
                        </button>
                    </div>
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default function ManageCohortPage() {
    const router = useRouter();
    const { id: cohortId } = router.query;
    const { data: session } = useSession(); // Get session data on the client
    const { data: cohort, error, isLoading } = useSWR<CohortDetails>(cohortId ? `/api/assessments/${cohortId}` : null, fetcher);
    const { mutate } = useSWRConfig();
    
    const [isAddCadetModalOpen, setIsAddCadetModalOpen] = useState(false);

    const handleRemoveCadet = async (assessmentId: number) => {
        if (window.confirm('Are you sure you want to remove this cadet from the cohort?')) {
            await fetch(`/api/assessments/${cohortId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assessmentId }),
            });
            mutate(`/api/assessments/${cohortId}`);
        }
    };

    if (isLoading) return <UserLayout pageTitle="Loading..."><div>Loading cohort details...</div></UserLayout>;
    if (error || !cohort) return <UserLayout pageTitle="Error"><div>Failed to load cohort.</div></UserLayout>;

    const isAdmin = session?.user?.role === Role.ADMIN;

    return (
        <UserLayout pageTitle={`Cohort: ${cohort.name}`}>
            {isAdmin && (
                <AddCadetModal isOpen={isAddCadetModalOpen} onClose={() => setIsAddCadetModalOpen(false)} onSave={() => mutate(`/api/assessments/${cohortId}`)} cohortId={cohortId as string} />
            )}

            {/* Conditionally render admin buttons */}
            {isAdmin && (
                <div className="flex items-center justify-between pb-4 mb-4">
                     <Link href={`/assessments/${cohortId}/print`} target="_blank" className="px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Generate Printable Form
                    </Link>
                    <button onClick={() => setIsAddCadetModalOpen(true)} className="px-4 py-2 font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">
                        Add Cadet
                    </button>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rank</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Full Name</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Sqn</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                            {isAdmin && <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cohort.assessments.map(({ cadet, id: assessmentId, passFail }) => (
                            <tr key={assessmentId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">{cadet.rank}</td>
                                <td className="px-6 py-4 font-medium whitespace-nowrap">
                                    <Link href={`/assess/${assessmentId}`} className="text-portal-blue hover:underline">
                                        {cadet.fullName}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{cadet.sqn}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        passFail ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {passFail ? 'Pass' : 'Pending'}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                        <button onClick={() => handleRemoveCadet(assessmentId)} className="text-red-600 hover:text-red-800">Remove</button>
                                    </td>
                                )}
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
    if (!session) { // Any logged-in user can view this page
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }
    return { props: {} };
};
