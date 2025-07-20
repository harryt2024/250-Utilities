import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR from 'swr';
import UserLayout from '../components/UserLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RotaEvent {
    title: string;
    start: string; // FullCalendar works best with ISO strings
    end: string;
    allDay: boolean;
    backgroundColor: string;
    borderColor: string;
}

export default function RotaPage() {
    const { data: apiEvents, error, isLoading } = useSWR('/api/rota/all', fetcher);

    // Format the events for FullCalendar
    const events: RotaEvent[] = apiEvents ? apiEvents.map((event: any) => ({
        title: event.title.replace(/\\n/g, '\n'), // Ensure newlines are rendered
        start: event.start,
        end: event.end,
        allDay: true,
        backgroundColor: event.type === 'lesson' ? '#3498db' : '#95a5a6', // portal-blue for lessons, grey for duties
        borderColor: event.type === 'lesson' ? '#3498db' : '#95a5a6',
    })) : [];

    return (
        <UserLayout pageTitle="Squadron Rota">
            <div className="p-4 bg-white rounded-lg shadow">
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load rota. Please try again later.</p>}
                {apiEvents && (
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,listWeek'
                        }}
                        events={events}
                        height="80vh"
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
