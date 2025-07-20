import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { Role, Lesson } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg } from '@fullcalendar/core'; // Correct import for EventClickArg
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction'; // Correct import for DateClickArg
import { useRouter } from 'next/router';
import { useState, FormEvent, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LessonData = (Lesson & { _count: { assignments: number; } });

function CreateLessonModal({ isOpen, onClose, onLessonCreate, initialDate }: { isOpen: boolean, onClose: () => void, onLessonCreate: () => void, initialDate: string }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [lessonDate, setLessonDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setLessonDate(initialDate);
            setError(null);
        }
    }, [isOpen, initialDate]);

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
                    <input type="date" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <input type="text" placeholder="Lesson Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">
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
    const [selectedDate, setSelectedDate] = useState('');

    const events = lessons ? lessons.map(lesson => ({
        id: lesson.id.toString(),
        title: `${lesson.title} (${lesson._count.assignments} assigned)`,
        start: lesson.lessonDate,
    })) : [];

    const handleEventClick = (clickInfo: EventClickArg) => {
        router.push(`/admin/lessons/${clickInfo.event.id}`);
    };

    const handleDateClick = (arg: DateClickArg) => {
        setSelectedDate(arg.dateStr);
        setIsModalOpen(true);
    };

    return (
        <AdminLayout pageTitle="Lesson Calendar">
            <CreateLessonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLessonCreate={() => mutate('/api/lessons')}
                initialDate={selectedDate}
            />
            <div className="p-4 bg-white rounded-lg shadow">
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load lessons.</p>}
                {lessons && (
                    <FullCalendar
                        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,listWeek'
                        }}
                        events={events}
                        height="80vh"
                        eventClick={handleEventClick}
                        dateClick={handleDateClick}
                        eventColor="#3498db"
                    />
                )}
            </div>
        </AdminLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }
    return { props: {} };
};
