import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { RadioAssessment, Cadet, AssessmentCohort, AssessmentStatus } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter } from 'next/router';
import UserLayout from '../../components/UserLayout';
import Link from 'next/link';
import { Check, X, HelpCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AssessmentDetails = (RadioAssessment & { cadet: Cadet, cohort: AssessmentCohort });

const criteria = [
    { key: 'firstClassLogbookCompleted', label: 'First Class Logbook Completed' },
    { key: 'basicCyberSecurityVideoWatched', label: 'Basic Cyber Security video watched' },
    { key: 'correctUseOfBothFullCallsigns', label: 'Correct use of both full callsigns' },
    { key: 'authenticateRequested', label: 'Authenticate requested' },
    { key: 'authenticateAnsweredCorrectly', label: 'Authenticate answered correctly' },
    { key: 'radioCheckRequested', label: 'Radio Check requested' },
    { key: 'radioCheckAnsweredCorrectly', label: 'Radio Check answered correctly' },
    { key: 'tacticalMessageFullyAnswered', label: 'Tactical message fully answered' },
    { key: 'iSayAgainUsedCorrectly', label: 'I Say Again used correctly' },
    { key: 'sayAgainUsed', label: 'Say Again used' },
    { key: 'prowordKnowledgeCompletedOK', label: 'Proword knowledge completed OK' },
    { key: 'securityKnowledgeCompletedOK', label: 'Security knowledge completed OK' },
    { key: 'generalOperatingAndConfidence', label: 'General operating and confidence' },
];

const StatusButton = ({ status, newStatus, onClick, children }: { status: AssessmentStatus, newStatus: AssessmentStatus, onClick: () => void, children: React.ReactNode }) => {
    const isActive = status === newStatus;
    const baseClasses = 'p-2 rounded-full transition-colors';
    const activeClasses = {
        PASS: 'bg-green-100 text-green-600',
        FAIL: 'bg-red-100 text-red-600',
        PENDING: 'bg-gray-100 text-gray-500',
    };
    const inactiveClasses = 'text-gray-300 hover:bg-gray-100';

    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses[newStatus] : inactiveClasses}`}>
            {children}
        </button>
    );
};

export default function AssessCadetPage() {
    const router = useRouter();
    const { assessmentId } = router.query;
    const { data: assessment, error, isLoading, mutate } = useSWR<AssessmentDetails>(assessmentId ? `/api/assessments/results/${assessmentId}` : null, fetcher);

    const handleStatusChange = async (key: keyof RadioAssessment, newStatus: AssessmentStatus) => {
        mutate({ ...assessment, [key]: newStatus } as AssessmentDetails, false);
        await fetch(`/api/assessments/results/${assessmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: newStatus }),
        });
        mutate();
    };

    if (isLoading) return <UserLayout pageTitle="Loading..."><div>Loading assessment...</div></UserLayout>;
    if (error || !assessment) return <UserLayout pageTitle="Error"><div>Failed to load assessment.</div></UserLayout>;

    return (
        <UserLayout pageTitle={`Assessing: ${assessment.cadet.fullName}`}>
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center p-4 mb-4 bg-white rounded-lg shadow">
                    <div>
                        <h2 className="text-lg font-bold">{assessment.cadet.rank} {assessment.cadet.fullName}</h2>
                        <p className="text-sm text-gray-600">Cohort: {assessment.cohort.name}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        assessment.passFail ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        Overall: {assessment.passFail ? 'Pass' : 'Pending/Fail'}
                    </span>
                </div>
                <div className="space-y-3">
                    {criteria.map(({ key, label }) => {
                        const currentStatus = assessment[key as keyof RadioAssessment] as AssessmentStatus;
                        return (
                            <div key={key} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                                <span className="text-gray-700">{label}</span>
                                <div className="flex items-center space-x-2">
                                    <StatusButton status={currentStatus} newStatus="PASS" onClick={() => handleStatusChange(key as keyof RadioAssessment, 'PASS')}><Check size={20} /></StatusButton>
                                    <StatusButton status={currentStatus} newStatus="FAIL" onClick={() => handleStatusChange(key as keyof RadioAssessment, 'FAIL')}><X size={20} /></StatusButton>
                                    <StatusButton status={currentStatus} newStatus="PENDING" onClick={() => handleStatusChange(key as keyof RadioAssessment, 'PENDING')}><HelpCircle size={20} /></StatusButton>
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-6">
                    <Link href={`/admin/assessments/${assessment.cohortId}`} className="text-sm text-portal-blue hover:underline">
                        &larr; Back to Cohort Management
                    </Link>
                </div>
            </div>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session) {
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }
    return { props: {} };
};
