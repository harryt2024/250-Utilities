import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR from 'swr';
import UserLayout from '../components/UserLayout';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { useMemo, useState, useCallback } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface RotaEvent {
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    backgroundColor: string;
    borderColor: string;
    type: 'lesson' | 'duty' | 'absence';
}

function RotaInfoModal({ isOpen, onClose, event }: { isOpen: boolean, onClose: () => void, event: RotaEvent | null }) {
    if (!isOpen || !event) return null;

    const formattedDate = new Date(event.start).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const getTitle = () => {
        if (event.type === 'lesson') return 'Lesson';
        if (event.type === 'duty') return 'Duty';
        return 'Absence';
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900">
                    Details for {formattedDate}
                </h2>
                <div className="mt-4 space-y-2">
                    <div className={`p-4 rounded-md ${event.type === 'lesson' ? 'bg-blue-50' : event.type === 'duty' ? 'bg-gray-50' : 'bg-red-50'}`}>
                        <h3 className="font-semibold text-gray-800">{getTitle()}</h3>
                        <p className="text-gray-700" style={{ whiteSpace: 'pre-line' }}>{event.title}</p>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">Close</button>
                </div>
            </div>
        </div>
    );
}


export default function RotaPage() {
    const { data: apiEvents, error, isLoading } = useSWR<any[]>('/api/rota/all', fetcher);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<RotaEvent | null>(null);

    const getEventColor = (type: string) => {
        if (type === 'lesson') return '#3498db';
        if (type === 'duty') return '#95a5a6';
        if (type === 'absence') return '#e74c3c';
        return '#373737';
    };

    const events: RotaEvent[] = useMemo(() => (apiEvents ? apiEvents.map((event: any) => ({
        title: event.title.replace(/\\n/g, '\n'),
        start: event.start,
        end: event.end,
        allDay: true,
        backgroundColor: getEventColor(event.type),
        borderColor: getEventColor(event.type),
        type: event.type,
    })) : []), [apiEvents]);

    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        const eventData = { ...clickInfo.event.toPlainObject(), extendedProps: clickInfo.event.extendedProps } as unknown as RotaEvent;
        setSelectedEvent(eventData);
        setIsModalOpen(true);
    }, []);

    return (
        <UserLayout pageTitle="Squadron Rota">
            <RotaInfoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                event={selectedEvent}
            />
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
                        eventClick={handleEventClick}
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
