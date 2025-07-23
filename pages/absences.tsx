import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR, { useSWRConfig } from 'swr';
import type { Absence, User } from '@prisma/client';
import { useState, FormEvent, useEffect, useMemo } from 'react';
import UserLayout from '../components/UserLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type AbsenceData = (Absence & { user: { fullName: string } });

function SubmitAbsenceModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: () => void }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStartDate(''); setEndDate(''); setReason(''); setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const response = await fetch('/api/absences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate, reason }),
        });
        if (response.ok) {
            onSave();
            onClose();
        } else {
            const data = await response.json();
            setError(data.message || 'Failed to submit absence.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold">Submit Absence</h2>
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
                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">Submit</button>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default function AbsencesPage() {
    const { data: absences, error, isLoading } = useSWR<AbsenceData[]>('/api/absences', fetcher);
    const { mutate } = useSWRConfig();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const events = useMemo(() => {
        // FIX: Ensure absences is an array before mapping
        if (!Array.isArray(absences)) return [];
        
        return absences.map(absence => ({
            title: `${absence.user.fullName} (Absent)`,
            start: absence.startDate,
            end: new Date(new Date(absence.endDate).getTime() + 86400000).toISOString().split('T')[0],
            allDay: true,
            backgroundColor: '#e74c3c',
            borderColor: '#e74c3c',
        }));
    }, [absences]);

    return (
        <UserLayout pageTitle="Absence Calendar">
            <SubmitAbsenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => mutate('/api/absences')} />
            <div className="flex items-center justify-end pb-4 mb-4">
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">
                    Submit New Absence
                </button>
            </div>
            <div className="p-4 bg-white rounded-lg shadow">
                {isLoading && <p className="text-center text-gray-500">Loading calendar...</p>}
                {error && <p className="text-center text-red-500">Failed to load absences.</p>}
                
                {/* FIX: Use a more robust check to ensure data is an array before rendering */}
                {Array.isArray(absences) && (
                    <FullCalendar
                        plugins={[dayGridPlugin, listPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,listWeek'
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
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }
    return { props: {} };
};
