import { getSession } from 'next-auth/react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Role, DutyRota, User, DutyStatus } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import { useState, FormEvent, useEffect, useMemo, useCallback } from 'react';
import { PrismaClient } from '@prisma/client';
import FullCalendar, { EventClickArg } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import AdminLayout from '../../components/AdminLayout';

const prisma = new PrismaClient();
const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DutyData = (DutyRota & {
    actualSenior: { fullName: string };
    actualJunior: { fullName: string };
    originalSenior: { fullName: string };
    originalJunior: { fullName: string };
});

function formatDateToYYYYMMDD(date: Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function DutyAssignmentModal({ isOpen, onClose, onSave, selectedDate, allUsers, existingDuty }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    selectedDate: Date | null;
    allUsers: User[];
    existingDuty: DutyData | undefined;
}) {
    const [actualSeniorId, setActualSeniorId] = useState('');
    const [actualJuniorId, setActualJuniorId] = useState('');
    const [seniorStatus, setSeniorStatus] = useState<DutyStatus>('UNCONFIRMED');
    const [juniorStatus, setJuniorStatus] = useState<DutyStatus>('UNCONFIRMED');
    const [formError, setFormError] = useState<string | null>(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActualSeniorId(existingDuty?.actualSeniorId.toString() || '');
            setActualJuniorId(existingDuty?.actualJuniorId.toString() || '');
            setSeniorStatus(existingDuty?.seniorStatus || 'UNCONFIRMED');
            setJuniorStatus(existingDuty?.juniorStatus || 'UNCONFIRMED');
            setFormError(null);
            setIsConfirmingDelete(false);
        }
    }, [isOpen, existingDuty]);

    if (!isOpen || !selectedDate) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        
        if (seniorStatus === 'ABSENT' && actualSeniorId === existingDuty?.originalSeniorId.toString()) {
            setFormError("Please select a replacement for the absent Duty Senior.");
            return;
        }
        if (juniorStatus === 'ABSENT' && actualJuniorId === existingDuty?.originalJuniorId.toString()) {
            setFormError("Please select a replacement for the absent Duty Junior.");
            return;
        }

        const formattedDate = formatDateToYYYYMMDD(selectedDate);
        const response = await fetch('/api/duties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dutyDate: formattedDate,
                originalSeniorId: existingDuty?.originalSeniorId || actualSeniorId,
                originalJuniorId: existingDuty?.originalJuniorId || actualJuniorId,
                actualSeniorId,
                actualJuniorId,
                seniorStatus,
                juniorStatus,
            }),
        });

        if (response.ok) {
            onSave();
            onClose();
        } else {
             const data = await response.json();
            setFormError(data.message || 'Failed to save assignment.');
        }
    };

    const handleDelete = async () => {
        const formattedDate = formatDateToYYYYMMDD(selectedDate);
        const response = await fetch('/api/duties', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dutyDate: formattedDate }),
        });
        if (response.ok) {
            onSave();
            onClose();
        } else {
            const data = await response.json();
            setFormError(data.message || 'Failed to delete assignment.');
        }
    };

    const isToday = new Date().toDateString() === new Date(selectedDate).toDateString();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-gray-900">
                    Manage Duties for {selectedDate.toLocaleDateString()}
                </h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {/* Duty Personnel Selection */}
                    <div className="p-4 border rounded-md">
                        <h3 className="text-sm font-medium text-gray-600">Duty Senior</h3>
                        {existingDuty && <p className="text-xs text-gray-500">Originally: {existingDuty.originalSenior.fullName}</p>}
                        <select value={actualSeniorId} onChange={e => setActualSeniorId(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md">
                            <option value="">Select User</option>
                            {allUsers.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
                        </select>
                    </div>
                    <div className="p-4 border rounded-md">
                        <h3 className="text-sm font-medium text-gray-600">Duty Junior</h3>
                        {existingDuty && <p className="text-xs text-gray-500">Originally: {existingDuty.originalJunior.fullName}</p>}
                        <select value={actualJuniorId} onChange={e => setActualJuniorId(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md">
                            <option value="">Select User</option>
                            {allUsers.map(user => <option key={user.id} value={user.id}>{user.fullName}</option>)}
                        </select>
                    </div>

                    {/* Attendance Confirmation */}
                    {existingDuty && isToday && (
                        <div className="p-4 space-y-3 border rounded-md">
                            <h3 className="text-sm font-medium text-gray-600">Attendance Confirmation</h3>
                            <div>
                                <p className="text-sm font-semibold">{existingDuty.originalSenior.fullName} (Senior)</p>
                                <div className="flex mt-1 space-x-4">
                                    <label className="flex items-center"><input type="radio" name="seniorStatus" value="ATTENDED" checked={seniorStatus === 'ATTENDED'} onChange={() => setSeniorStatus('ATTENDED')} className="w-4 h-4 text-portal-blue" /><span className="ml-2 text-sm">Attended</span></label>
                                    <label className="flex items-center"><input type="radio" name="seniorStatus" value="ABSENT" checked={seniorStatus === 'ABSENT'} onChange={() => setSeniorStatus('ABSENT')} className="w-4 h-4 text-portal-blue" /><span className="ml-2 text-sm">Absent</span></label>
                                </div>
                            </div>
                             <div>
                                <p className="text-sm font-semibold">{existingDuty.originalJunior.fullName} (Junior)</p>
                                <div className="flex mt-1 space-x-4">
                                    <label className="flex items-center"><input type="radio" name="juniorStatus" value="ATTENDED" checked={juniorStatus === 'ATTENDED'} onChange={() => setJuniorStatus('ATTENDED')} className="w-4 h-4 text-portal-blue" /><span className="ml-2 text-sm">Attended</span></label>
                                    <label className="flex items-center"><input type="radio" name="juniorStatus" value="ABSENT" checked={juniorStatus === 'ABSENT'} onChange={() => setJuniorStatus('ABSENT')} className="w-4 h-4 text-portal-blue" /><span className="ml-2 text-sm">Absent</span></label>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                        {existingDuty && !isConfirmingDelete && (
                             <button type="button" onClick={() => setIsConfirmingDelete(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                        )}
                        {existingDuty && isConfirmingDelete && (
                            <div className="flex space-x-2">
                                <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800">Confirm</button>
                                <button type="button" onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            </div>
                        )}
                        <div className="flex-grow"></div>
                        <div className="flex space-x-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-portal-blue rounded-md hover:bg-portal-blue-light">Save</button>
                        </div>
                    </div>
                    {formError && <p className="mt-2 text-sm text-red-500">{formError}</p>}
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

    const events = useMemo(() => (duties ? duties.map(duty => {
        const isFullyAttended = duty.seniorStatus === 'ATTENDED' && duty.juniorStatus === 'ATTENDED';
        const isPartialOrAbsent = duty.seniorStatus === 'ABSENT' || duty.juniorStatus === 'ABSENT';
        
        let backgroundColor = '#95a5a6'; // Default grey
        if (isFullyAttended) backgroundColor = '#27ae60'; // Green
        if (isPartialOrAbsent) backgroundColor = '#f39c12'; // Orange

        const utcDate = new Date(duty.dutyDate);
        const localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        
        return {
            title: `DS: ${duty.actualSenior.fullName}\nDJ: ${duty.actualJunior.fullName}`,
            start: localDate,
            allDay: true,
            backgroundColor,
            borderColor: backgroundColor,
        }
    }) : []), [duties]);

    const handleDateClick = (arg: DateClickArg) => {
        setSelectedDate(arg.date);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: EventClickArg) => {
        setSelectedDate(clickInfo.event.start);
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
                        eventClick={handleEventClick}
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
