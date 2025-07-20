import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR from 'swr';
import type { DutyRota } from '@prisma/client';
import UserLayout from '../components/UserLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type MyDutyData = (DutyRota & {
    dutySenior: { fullName: string };
    dutyJunior: { fullName: string };
    userDuty: 'Duty Senior' | 'Duty Junior';
});

export default function MyDutiesPage() {
    const { data: duties, error, isLoading } = useSWR<MyDutyData[]>('/api/rota/my-duties', fetcher);

    const events = useMemo(() => (duties ? duties.map(duty => ({
        title: `Your Role: ${duty.userDuty}\nDS: ${duty.dutySenior.fullName}\nDJ: ${duty.dutyJunior.fullName}`,
        start: duty.dutyDate,
        allDay: true,
    })) : []), [duties]);

    return (
        <UserLayout pageTitle="My Assigned Duties">
            <div className="p-4 bg-white rounded-lg shadow">
                {isLoading && <p className="text-center text-gray-500">Loading your duties...</p>}
                {error && <p className="text-center text-red-500">Failed to load duties. Please try again later.</p>}
                
                {duties && (
                    <FullCalendar
                        plugins={[dayGridPlugin, listPlugin]}
                        initialView="listWeek" // Default to a list view for clarity
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,listWeek'
                        }}
                        events={events}
                        height="80vh"
                        eventColor="#95a5a6" // Use the grey 'duty' color
                        noEventsContent="You have not been assigned to any duties."
                    />
                )}
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
