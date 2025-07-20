import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR from 'swr';
import UserLayout from '../components/UserLayout';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg } from '@fullcalendar/core'; // Correct import for EventClickArg
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
    type: 'lesson' | 'duty';
}

// --- Read-Only Info Modal Component ---
function RotaInfoModal({ isOpen, onClose, event }: { isOpen: boolean, onClose: () => void, event: RotaEvent | null }) {
    if (!isOpen || !event) return null;

    const formattedDate = new Date(event.start).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900">
                    Details for {formattedDate}
                </h2>
                <div className="mt-4 space-y-2">
                    <div className={`p-4 rounded-md ${event.type === 'lesson' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <h3 className="font-semibold text-gray-800">{event.type === 'lesson' ? 'Lesson' : 'Duty'}</h3>
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

    const events: RotaEvent[] = useMemo(() => (apiEvents ? apiEvents.map((event: any) => ({
        title: event.title.replace(/\\n/g, '\n'),
        start: event.start,
        end: event.end,
        allDay: true,
        backgroundColor: event.type === 'lesson' ? '#3498db' : '#95a5a6',
        borderColor: event.type === 'lesson' ? '#3498db' : '#95a5a6',
        type: event.type,
    })) : []), [apiEvents]);

    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        // We cast the extendedProps to get our custom 'type' property
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
