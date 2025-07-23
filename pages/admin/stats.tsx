import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { Role } from '@prisma/client';
import useSWR from 'swr';
import { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { ChevronDown, ChevronUp } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DutyStat = {
    id: number;
    fullName: string;
    seniorDuties: number;
    juniorDuties: number;
    totalDuties: number;
};

type SortKey = 'fullName' | 'seniorDuties' | 'juniorDuties' | 'totalDuties';
type SortOrder = 'asc' | 'desc';

export default function StatsPage() {
    const { data: stats, error, isLoading } = useSWR<DutyStat[]>('/api/stats/duties', fetcher);
    const [sortBy, setSortBy] = useState<SortKey>('totalDuties');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const handleSort = (key: SortKey) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('desc');
        }
    };

    const sortedStats = useMemo(() => {
        if (!stats) return [];
        return [...stats].sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [stats, sortBy, sortOrder]);

    const SortableHeader = ({ sortKey, label }: { sortKey: SortKey, label: string }) => (
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
            <button onClick={() => handleSort(sortKey)} className="flex items-center space-x-1">
                <span>{label}</span>
                {sortBy === sortKey && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
        </th>
    );

    return (
        <AdminLayout pageTitle="Duty Statistics">
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <SortableHeader sortKey="fullName" label="Name" />
                            <SortableHeader sortKey="seniorDuties" label="Senior Duties" />
                            <SortableHeader sortKey="juniorDuties" label="Junior Duties" />
                            <SortableHeader sortKey="totalDuties" label="Total Duties" />
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={4} className="py-4 text-center text-gray-500">Loading statistics...</td></tr>}
                        {error && <tr><td colSpan={4} className="py-4 text-center text-red-500">Failed to load statistics.</td></tr>}
                        {sortedStats.map(stat => (
                            <tr key={stat.id}>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{stat.fullName}</td>
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{stat.seniorDuties}</td>
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{stat.juniorDuties}</td>
                                <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">{stat.totalDuties}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
