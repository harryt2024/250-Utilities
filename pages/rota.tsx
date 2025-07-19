import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR from 'swr';
import { Calendar, dateFnsLocalizer, Event, EventProps } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useMemo } from 'react';
import UserLayout from '../components/UserLayout';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface RotaEvent extends Event {
    type: 'lesson' | 'duty';
}

// Custom component to style events based on their type
const EventComponent = ({ event }: EventProps<RotaEvent>) => {
    const backgroundColor = event.type === 'lesson' ? '#3498db' : '#95a5a6'; // Blue for lessons, grey for duties
    return (
        <div style={{ backgroundColor, borderRadius: '5px', color: 'white', padding: '2px 5px', height: '100%', whiteSpace: 'pre-line', fontSize: '0.8em', lineHeight: '1.2' }}>
            {event.title}
        </div>
    );
};

export default function RotaPage() {
    const { data: events, error, isLoading } = useSWR<RotaEvent[]>('/api/rota/all', fetcher);

    const components = useMemo(() => ({
        event: EventComponent,
    }), []);

    return (
        <UserLayout pageTitle="Squadron Rota">
            <div className="p-4 bg-white rounded-lg shadow" style={{ height: '80vh' }}>
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load rota. Please try again later.</p>}
                {events && (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ flex: 1 }}
                        components={components}
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
