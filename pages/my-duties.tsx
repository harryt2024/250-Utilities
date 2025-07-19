import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR from 'swr';
import type { DutyRota } from '@prisma/client';
import UserLayout from '../components/UserLayout';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Define the shape of the duty data we expect from our API
type MyDutyData = (DutyRota & {
    dutySenior: { fullName: string };
    dutyJunior: { fullName: string };
    userDuty: 'Duty Senior' | 'Duty Junior';
});

export default function MyDutiesPage() {
    const { data: duties, error, isLoading } = useSWR<MyDutyData[]>('/api/rota/my-duties', fetcher);

    return (
        <UserLayout pageTitle="My Assigned Duties">
            <div className="space-y-4">
                {isLoading && <p className="text-center text-gray-500">Loading your duties...</p>}
                {error && <p className="text-center text-red-500">Failed to load duties. Please try again later.</p>}
                
                {duties && duties.length === 0 && (
                    <div className="p-6 text-center bg-white rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">No Duties Assigned</h3>
                        <p className="mt-1 text-gray-500">You have not been assigned to any duties yet.</p>
                    </div>
                )}

                {duties && duties.map(duty => (
                    <div key={duty.id} className="p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg font-semibold text-gray-800">
                                    {format(new Date(duty.dutyDate), 'EEEE, MMMM d, yyyy')}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Your Role: <span className="font-semibold text-portal-blue">{duty.userDuty}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">
                                    <span className="font-medium">Duty Senior:</span> {duty.dutySenior.fullName}
                                </p>
                                <p className="text-sm text-gray-500">
                                   <span className="font-medium">Duty Junior:</span> {duty.dutyJunior.fullName}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session) {
        return {
            redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        };
    }
    return { props: {} };
};
