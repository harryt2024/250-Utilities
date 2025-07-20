import { getSession } from 'next-auth/react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Role, DutyRota, User } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import { useState, FormEvent, useEffect, useMemo } from 'react';
import { PrismaClient } from '@prisma/client';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import AdminLayout from '../../components/AdminLayout';

const prisma = new PrismaClient();
const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DutyData = (DutyRota & {
    dutySenior: { fullName: string };
    dutyJunior: { fullName: string };
});

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
                    Assign Duties for {selectedDate.toLocaleDateString()}
                </h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <select id="dutySenior" value={dutySeniorId} onChange={e => setDutySeniorId(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                        <option value="">Select Duty Senior</option>
                        {allUsers.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
                    </select>
                    <select id="dutyJunior" value={dutyJuniorId} onChange={e => setDutyJuniorId(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                        <option value="">Select Duty Junior</option>
                        {allUsers.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
                    </select>
                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-portal-blue rounded-md hover:bg-portal-blue-light">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DutyRotaPage({ allUsers }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const { data: duties, error, isLoading } = useSWR<DutyData[]>('/api/duties', fetcher);
    const { mutate } = useSWRConfig();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const events = useMemo(() => (duties ? duties.map(duty => ({
        title: `DS: ${duty.dutySenior.fullName}\nDJ: ${duty.dutyJunior.fullName}`,
        start: duty.dutyDate,
        allDay: true
    })) : []), [duties]);

    const handleDateClick = (arg: DateClickArg) => {
        setSelectedDate(arg.date);
        setIsModalOpen(true);
    };

    const selectedDuty = useMemo(() => 
        duties?.find(d => selectedDate && new Date(d.dutyDate).toDateString() === selectedDate.toDateString()),
        [duties, selectedDate]
    );

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
            <div className="p-4 bg-white rounded-lg shadow">
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load duties.</p>}
                {duties && (
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
                        dateClick={handleDateClick}
                        eventColor="#95a5a6"
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
    const allUsers = await prisma.user.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } });
    return { props: { allUsers } };
};
