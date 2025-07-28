import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { Role, AssessmentCohort, RadioAssessment, Cadet, PrismaClient, AssessmentStatus } from '@prisma/client';
import { Fragment } from 'react';

const prisma = new PrismaClient();

type CohortDetails = (AssessmentCohort & {
    assessments: (RadioAssessment & { cadet: Cadet })[];
});

const criteriaKeys: (keyof RadioAssessment)[] = [
    'firstClassLogbookCompleted', 'basicCyberSecurityVideoWatched', 'correctUseOfBothFullCallsigns',
    'authenticateRequested', 'authenticateAnsweredCorrectly', 'radioCheckRequested',
    'radioCheckAnsweredCorrectly', 'tacticalMessageFullyAnswered', 'iSayAgainUsedCorrectly',
    'sayAgainUsed', 'prowordKnowledgeCompletedOK', 'securityKnowledgeCompletedOK',
    'generalOperatingAndConfidence', 'passFail',
];

const criteriaLabels: Record<string, string> = {
    firstClassLogbookCompleted: 'First Class Logbook Completed',
    basicCyberSecurityVideoWatched: 'Basic Cyber Security video watched',
    correctUseOfBothFullCallsigns: 'Correct use of both full callsigns',
    authenticateRequested: 'Authenticate requested',
    authenticateAnsweredCorrectly: 'Authenticate answered correctly',
    radioCheckRequested: 'Radio Check requested',
    radioCheckAnsweredCorrectly: 'Radio Check answered correctly',
    tacticalMessageFullyAnswered: 'Tactical message fully answered',
    iSayAgainUsedCorrectly: 'I Say Again used correctly',
    sayAgainUsed: 'Say Again used',
    prowordKnowledgeCompletedOK: 'Proword knowledge completed OK',
    securityKnowledgeCompletedOK: 'Security knowledge completed OK',
    generalOperatingAndConfidence: 'General operating and confidence',
    passFail: 'PASS / FAIL',
};

const AssessmentTable = ({ cadets, cohort, pageNumber }: { cadets: (RadioAssessment & { cadet: Cadet })[], cohort: CohortDetails, pageNumber: number }) => (
    <div className="bg-white p-8 break-inside-avoid font-sans w-[29.7cm] h-[21cm] flex flex-col">
        <div className="flex justify-between items-center">
            <h1 className="font-bold text-xl">Assessment Results – Basic Radio Operator Award</h1>
            <div className="font-bold text-base"><u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u> Sqn / Wing</div>
        </div>
        
        <div className="border-2 border-black mt-4 flex-grow">
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="text-center font-bold">
                        <td className="border-r-2 border-b-2 border-black p-1 w-[5%]" rowSpan={2}>SERIAL</td>
                        <td className="border-r-2 border-b-2 border-black p-1 w-[7%]" rowSpan={2}>SQN</td>
                        <td className="border-r-2 border-b-2 border-black p-1 w-[10%]" rowSpan={2}>RANK</td>
                        <td className="border-r-2 border-b-2 border-black p-1 w-[24%]" rowSpan={2}>FORENAME - SURNAME<br/>(FOR CERTIFICATE)</td>
                        <td className="border-b-2 border-black p-1" colSpan={14}>On-Air Assessment</td>
                    </tr>
                    <tr className="text-center font-bold">
                        {criteriaKeys.map(key => (
                            <td key={key} className="border-r border-black p-1 w-[3.2%] align-bottom">
                                <div className="h-56 flex items-end justify-center">
                                    <span className="inline-block whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                        {criteriaLabels[key]}
                                    </span>
                                </div>
                            </td>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 10 }).map((_, i) => {
                        const assessment = cadets[i];
                        const serial = (pageNumber - 1) * 10 + i + 1;
                        return (
                            <tr key={i} className="h-[29.5px]">
                                <td className="border-r-2 border-t-2 border-black text-center font-bold">{assessment ? serial : ''}</td>
                                <td className="border-r-2 border-t-2 border-black text-center">{assessment?.cadet.sqn}</td>
                                <td className="border-r-2 border-t-2 border-black text-center">{assessment?.cadet.rank}</td>
                                <td className="border-r-2 border-t-2 border-black pl-2">{assessment?.cadet.fullName}</td>
                                {criteriaKeys.map(key => {
                                    const status = assessment ? assessment[key as keyof RadioAssessment] : null;
                                    let mark = '';
                                    if (key === 'passFail') {
                                        mark = assessment?.passFail ? '✔' : '✖';
                                    } else if (status === AssessmentStatus.PASS) {
                                        mark = '✔';
                                    } else if (status === AssessmentStatus.FAIL) {
                                        mark = '✖';
                                    }
                                    return (
                                        <td key={key} className="border-r border-t-2 border-black text-center font-bold">
                                            {mark}
                                        </td>
                                    );
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        <div className="mt-auto space-y-3 text-base">
            <div className="flex items-center">Instructor: Rank <span className="inline-block w-24 border-b border-black mx-2"></span> Name <span className="inline-block w-56 border-b border-black mx-2"></span> Sqn <span className="inline-block w-24 border-b border-black mx-2"></span> Signed <span className="inline-block flex-grow border-b border-black mx-2"></span> Date <span className="inline-block w-32 border-b border-black mx-2"></span></div>
            <div className="flex items-center">Assessor: &nbsp;&nbsp;Rank <span className="inline-block w-24 border-b border-black mx-2"></span> Name <span className="inline-block w-56 border-b border-black mx-2"></span> Sqn <span className="inline-block w-24 border-b border-black mx-2"></span> Signed <span className="inline-block flex-grow border-b border-black mx-2"></span> Date <span className="inline-block w-32 border-b border-black mx-2"></span></div>
        </div>
        <div className="flex justify-between items-end mt-2">
            <p className="text-xs">Send to WRCO when complete for issue of awards. Include an address to where badges should be sent.</p>
            <p className="text-xs">V1.5</p>
        </div>
    </div>
);


export default function PrintAssessmentPage({ cohort }: { cohort: CohortDetails }) {
    const allCadets = cohort.assessments;
    const pages = [];
    for (let i = 0; i < allCadets.length; i += 10) {
        pages.push(allCadets.slice(i, i + 10));
    }

    return (
        <div className="bg-gray-200">
            {pages.map((pageCadets, pageIndex) => (
                <AssessmentTable key={pageIndex} cadets={pageCadets} cohort={cohort} pageNumber={pageIndex + 1} />
            ))}
            <style jsx global>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                    @page { size: A4 landscape; margin: 0; }
                }
            `}</style>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session || session.user.role !== Role.ADMIN) {
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }

    const cohortId = context.params?.id as string;
    const cohort = await prisma.assessmentCohort.findUnique({
        where: { id: parseInt(cohortId) },
        include: {
          assessments: {
            include: { cadet: true },
            orderBy: { cadet: { fullName: 'asc' } },
          },
        },
    });

    if (!cohort) return { notFound: true };

    return { props: { cohort: JSON.parse(JSON.stringify(cohort)) } };
};