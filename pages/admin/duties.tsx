import { getSession } from 'next-auth/react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Role, DutyRota, User } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import { PrismaClient } from '@prisma/client';
import { Calendar, dateFnsLocalizer, Event, View, Components } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AdminLayout from '../../components/AdminLayout';

const prisma = new PrismaClient();
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type DutyData = (DutyRota & {
    dutySenior: { fullName: string };
    dutyJunior: { fullName: string };
});

// --- Duty Assignment Modal Component ---
function DutyAssignmentModal({ isOpen, onClose, onSave, selectedDate, allUsers, existingDuty }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    selectedDate: Date | null;
    allUsers: User[];
    existingDuty: DutyData | undefined;
}) {
    const [dutySeniorId, setDutySeniorId] = useState('');
    const [dutyJuniorId, setDutyJuniorId] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setDutySeniorId(existingDuty?.dutySeniorId.toString() || '');
            setDutyJuniorId(existingDuty?.dutyJuniorId.toString() || '');
            setFormError(null);
        }
    }, [isOpen, existingDuty]);

    if (!isOpen || !selectedDate) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        const response = await fetch('/api/duties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dutyDate: selectedDate, dutySeniorId, dutyJuniorId }),
        });
        if (response.ok) {
            onSave();
            onClose();
        } else {
            const data = await response.json();
            setFormError(data.message || 'Failed to save assignment.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900">
                    Assign Duties for {format(selectedDate, 'MMMM d, yyyy')}
                </h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {formError && <p className="text-sm text-red-500">{formError}</p>}
                    <div>
                        <label htmlFor="dutySenior" className="block text-sm font-medium text-gray-700">Duty Senior</label>
                        <select id="dutySenior" value={dutySeniorId} onChange={e => setDutySeniorId(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                            <option value="">Select User</option>
                            {allUsers.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dutyJunior" className="block text-sm font-medium text-gray-700">Duty Junior</label>
                        <select id="dutyJunior" value={dutyJuniorId} onChange={e => setDutyJuniorId(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                            <option value="">Select User</option>
                            {allUsers.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-portal-blue rounded-md hover:bg-portal-blue-light">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- Main Page Component ---
export default function DutyRotaPage({ allUsers }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { data: duties, error, isLoading } = useSWR<DutyData[]>('/api/duties', fetcher);
    const { mutate } = useSWRConfig();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState<View>('month');

    const events: Event[] = useMemo(() => (duties ? duties.map(duty => ({
        title: `DS: ${duty.dutySenior.fullName}\nDJ: ${duty.dutyJunior.fullName}`,
        start: new Date(duty.dutyDate),
        end: new Date(duty.dutyDate),
        resource: duty,
    })) : []), [duties]);

    const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
        setSelectedDate(start);
        setIsModalOpen(true);
    }, []);

    const handleSelectEvent = useCallback((event: Event) => {
        setSelectedDate(event.start);
        setIsModalOpen(true);
    }, []);

    const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
    const onView = useCallback((newView: View) => setView(newView), []);

    const selectedDuty = useMemo(() => 
        duties?.find(d => selectedDate && new Date(d.dutyDate).toDateString() === selectedDate.toDateString()),
        [duties, selectedDate]
    );

    const AgendaEvent = ({ event }: { event: Event }) => (
        <div className="flex items-center justify-between w-full">
            <div style={{ whiteSpace: 'pre-line' }}>{event.title}</div>
            <button
                onClick={() => handleSelectEvent(event)}
                className="ml-4 px-3 py-1 text-xs font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light focus:outline-none"
            >
                Edit
            </button>
        </div>
    );

    const components: Components<Event, object> = useMemo(() => ({
        event: ({ event }) => (
            <div style={{ whiteSpace: 'pre-line', fontSize: '0.8em', lineHeight: '1.2' }}>
                {event.title}
            </div>
        ),
        agenda: {
            event: AgendaEvent,
        },
    }), [handleSelectEvent]);

    return (
        <AdminLayout pageTitle="Duty Rota Calendar">
            <DutyAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={() => mutate('/api/duties')}
                selectedDate={selectedDate}
                allUsers={allUsers}
                existingDuty={selectedDuty}
            />
            <div className="p-4 bg-white rounded-lg shadow" style={{ height: '80vh' }}>
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load duties.</p>}
                {duties && (
                    <Calendar
                        key={duties.length}
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ flex: 1 }}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        date={date}
                        view={view}
                        onNavigate={onNavigate}
                        onView={onView}
                        components={components}
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

    const allUsers = await prisma.user.findMany({
        select: { id: true, fullName: true },
        orderBy: { fullName: 'asc' },
    });

    return { props: { allUsers } };
};
