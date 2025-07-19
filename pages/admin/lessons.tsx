import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { Role, Lesson } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import { Calendar, dateFnsLocalizer, Event, Components, View } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useRouter } from 'next/router';
import { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type LessonData = (Lesson & {
    _count: { assignments: number; };
})

// --- Create Lesson Modal Component ---
function CreateLessonModal({ isOpen, onClose, onLessonCreate }: { isOpen: boolean, onClose: () => void, onLessonCreate: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [lessonDate, setLessonDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setLessonDate('');
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        const response = await fetch('/api/lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, lessonDate }),
        });
        if (response.ok) {
            onLessonCreate();
            onClose();
        } else {
            const data = await response.json();
            setError(data.message || 'Failed to create lesson.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900">Create New Lesson</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <input type="text" placeholder="Lesson Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <input type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light disabled:bg-blue-300">
                            {isSubmitting ? 'Creating...' : 'Create Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


export default function LessonManagementPage() {
    const { data: lessons, error, isLoading } = useSWR<LessonData[]>('/api/lessons', fetcher);
    const { mutate } = useSWRConfig();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State for managing calendar view and date
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>('month');

    const events: Event[] = useMemo(() => (lessons ? lessons.map(lesson => ({
        title: `${lesson.title} (${lesson._count.assignments} assigned)`,
        start: new Date(lesson.lessonDate),
        end: new Date(lesson.lessonDate),
        resource: lesson.id,
    })) : []), [lessons]);

    const handleSelectEvent = useCallback((event: Event) => {
        router.push(`/admin/lessons/${event.resource}`);
    }, [router]);
    
    const onNavigate = useCallback((newDate: Date) => setDate(newDate), [setDate]);
    const onView = useCallback((newView: View) => setView(newView), [setView]);

    // Custom component for rendering events in the agenda view
    const AgendaEvent = ({ event }: { event: Event }) => {
        return (
            <div className="flex items-center justify-between w-full">
                <span>{event.title}</span>
                <button
                    onClick={() => handleSelectEvent(event)}
                    className="ml-4 px-3 py-1 text-xs font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light focus:outline-none"
                >
                    Manage
                </button>
            </div>
        );
    };
    
    const components: Components<Event, object> = useMemo(() => ({
        agenda: {
            event: AgendaEvent,
        },
    }), [handleSelectEvent]);

    return (
        <AdminLayout pageTitle="Lesson Calendar">
            <CreateLessonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLessonCreate={() => mutate('/api/lessons')}
            />
            <div className="flex items-center justify-end pb-4 mb-4">
                 <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-portal-blue"
                >
                    Create New Lesson
                </button>
            </div>
            <div className="p-4 bg-white rounded-lg shadow" style={{ height: '75vh' }}>
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load lessons.</p>}
                {lessons && (
                    <Calendar
                        // Add a key that changes when lessons update to force a re-render
                        key={lessons.length}
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        onSelectEvent={handleSelectEvent}
                        style={{ flex: 1 }}
                        // Use the custom component for the agenda view
                        components={components}
                        date={date}
                        view={view}
                        onNavigate={onNavigate}
                        onView={onView}
                    />
                )}
            </div>
        </AdminLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
        return {
            redirect: {
                destination: '/auth/signin?error=You are not authorized to view this page.',
                permanent: false,
            },
        };
    }
    return { props: {} };
};
