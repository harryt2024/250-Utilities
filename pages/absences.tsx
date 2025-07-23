import { getSession, useSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR, { useSWRConfig } from 'swr';
import type { Absence, User } from '@prisma/client';
import { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg } from '@fullcalendar/core'; // Correct import for EventClickArg
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import UserLayout from '../components/UserLayout';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AbsenceData = (Absence & { user: { fullName: string } });

function AbsenceModal({ isOpen, onClose, onSave, absenceToEdit }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    absenceToEdit: AbsenceData | null;
}) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStartDate(absenceToEdit ? new Date(absenceToEdit.startDate).toISOString().split('T')[0] : '');
            setEndDate(absenceToEdit ? new Date(absenceToEdit.endDate).toISOString().split('T')[0] : '');
            setReason(absenceToEdit?.reason || '');
            setError(null);
            setIsConfirmingDelete(false);
        }
    }, [isOpen, absenceToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const url = absenceToEdit ? `/api/absences/${absenceToEdit.id}` : '/api/absences';
        const method = absenceToEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, reason }),
        });
        if (response.ok) {
            onSave();
            onClose();
        } else {
            const data = await response.json();
            setError(data.message || 'Failed to save absence.');
        }
    };

    const handleDelete = async () => {
        if (!absenceToEdit) return;
        const response = await fetch(`/api/absences/${absenceToEdit.id}`, { method: 'DELETE' });
        if (response.ok) {
            onSave();
            onClose();
        } else {
            const data = await response.json();
            setError(data.message || 'Failed to delete absence.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold">{absenceToEdit ? 'Edit Absence' : 'Submit Absence'}</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium">Start Date</label>
                            <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium">End Date</label>
                            <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium">Reason (Optional)</label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 mt-1 border rounded-md" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        {absenceToEdit && !isConfirmingDelete && (
                             <button type="button" onClick={() => setIsConfirmingDelete(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                        )}
                        {absenceToEdit && isConfirmingDelete && (
                            <div className="flex space-x-2">
                                <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800">Confirm</button>
                                <button type="button" onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            </div>
                        )}
                        <div className="flex-grow"></div>
                        <div className="flex space-x-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">Save</button>
                        </div>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default function AbsencesPage() {
    const { data: absences, error, isLoading } = useSWR<AbsenceData[]>('/api/absences', fetcher);
    const { data: session } = useSession();
    const { mutate } = useSWRConfig();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState<AbsenceData | null>(null);

    const events = useMemo(() => {
        if (!Array.isArray(absences)) return [];
        return absences.map(absence => ({
            id: absence.id.toString(),
            title: `${absence.user.fullName} (Absent)`,
            start: absence.startDate,
            end: new Date(new Date(absence.endDate).getTime() + 86400000).toISOString().split('T')[0],
            allDay: true,
            backgroundColor: '#e74c3c',
            borderColor: '#e74c3c',
            extendedProps: {
                userId: absence.userId
            }
        }));
    }, [absences]);

    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        const clickedAbsenceId = parseInt(clickInfo.event.id);
        const clickedUserId = clickInfo.event.extendedProps.userId;

        // Allow user to edit their own absence, or if user is an admin
        if (session?.user?.id === clickedUserId.toString() || session?.user?.role === 'ADMIN') {
            const absence = absences?.find(a => a.id === clickedAbsenceId);
            if (absence) {
                setSelectedAbsence(absence);
                setIsModalOpen(true);
            }
        }
    }, [absences, session]);

    const handleAddNew = () => {
        setSelectedAbsence(null); // Ensure we're creating a new one
        setIsModalOpen(true);
    };

    return (
        <UserLayout pageTitle="Absence Calendar">
            <AbsenceModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={() => mutate('/api/absences')}
                absenceToEdit={selectedAbsence}
            />
            <div className="flex items-center justify-end pb-4 mb-4">
                <button onClick={handleAddNew} className="px-4 py-2 font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">
                    Submit New Absence
                </button>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load absences.</p>}
                {Array.isArray(absences) && (
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
                    />
                )}
            </div>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session) {
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }
    return { props: {} };
};