import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR, { useSWRConfig } from 'swr';
import type { UniformItem, User, UniformType, UniformCondition } from '@prisma/client';
import { useState, FormEvent, useEffect, useMemo, useRef } from 'react';
import UserLayout from '../components/UserLayout';
import { Role } from '@prisma/client';
import { ChevronDown, ChevronUp } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UniformData = (UniformItem & {
    addedBy: { fullName: string };
});

const uniformTypeMap: Record<UniformType, string> = {
    MENS_TROUSERS: "Men's Trousers",
    MENS_WEDGEWOOD_SHIRT: "Men's Wedgewood Shirt",
    MENS_WORKING_BLUE_SHIRT: "Men's Working Blue Shirt",
    BRASSARD: "Brassard",
    BLUE_GREY_BELT: "Blue Grey Belt",
    BLACK_SOCKS: "Black Socks",
    BLACK_LEATHER_GLOVES: "Black Leather Gloves",
    WOMENS_TROUSERS: "Women's Trousers",
    WOMENS_SLACKS: "Women's Slacks",
    WOMENS_WORKING_BLUE_SHIRT: "Women's Working Blue Shirt",
    WOMENS_SKIRT: "Women's Skirt",
    WOMENS_WEDGEWOOD_SHIRT: "Women's Wedgewood Shirt",
    FOUL_WEATHER_JACKET: "Foul Weather Jacket",
    BERET_AND_BADGE: "Beret and Badge",
    MISC: "Misc",
};

const uniformConditionMap: Record<UniformCondition, string> = {
    NEW: "New",
    GOOD: "Good",
    SERVICEABLE: "Serviceable",
    POOR: "Poor",
};

function AddUniformModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: () => void }) {
    const [type, setType] = useState<UniformType | ''>('');
    const [size, setSize] = useState('');
    const [condition, setCondition] = useState<UniformCondition | ''>('');
    const [quantity, setQuantity] = useState('1');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs to manage focus for the rapid entry workflow
    const sizeInputRef = useRef<HTMLInputElement>(null);
    const conditionInputRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (isOpen) {
            setType(''); setSize(''); setCondition(''); setQuantity('1'); setError(null); setSuccess(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!type || !size || !condition) {
            setError("All fields must be filled.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        
        const response = await fetch('/api/uniforms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, size, condition, quantity }),
        });

        if (response.ok) {
            onSave();
            setSuccess(`${quantity} item(s) of type '${uniformTypeMap[type]}' added.`);
            // Reset for next entry
            setSize('');
            setCondition('');
            setQuantity('1');
            sizeInputRef.current?.focus(); // Move focus back to the size input
        } else {
            const data = await response.json();
            setError(data.message || 'Failed to add item.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold">Add New Uniform Item</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <select value={type} onChange={e => setType(e.target.value as UniformType)} required className="w-full px-3 py-2 border rounded-md">
                        <option value="">Select Type</option>
                        {Object.entries(uniformTypeMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                    </select>
                    <input ref={sizeInputRef} type="text" placeholder="Size" value={size} onChange={e => setSize(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <select ref={conditionInputRef} value={condition} onChange={e => setCondition(e.target.value as UniformCondition)} required className="w-full px-3 py-2 border rounded-md">
                        <option value="">Select Condition</option>
                        {Object.entries(uniformConditionMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                    </select>
                    <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" required className="w-full px-3 py-2 border rounded-md" />
                    
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end pt-2 space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">
                            {isSubmitting ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

type SortKey = 'type' | 'size' | 'condition' | 'addedBy';
type SortOrder = 'asc' | 'desc';

export default function UniformPage() {
    const { data: uniforms, error, isLoading } = useSWR<UniformData[]>('/api/uniforms', fetcher);
    const { mutate } = useSWRConfig();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

    // State for filtering and sorting
    const [typeFilter, setTypeFilter] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('type');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const executeDelete = async (id: number) => {
        await fetch(`/api/uniforms/${id}`, { method: 'DELETE' });
        mutate('/api/uniforms');
        setConfirmingDeleteId(null);
    };

    const handleSort = (key: SortKey) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
    };

    const filteredAndSortedUniforms = useMemo(() => {
        if (!uniforms) return [];
        
        const filtered = uniforms.filter(item => 
            (typeFilter === '' || item.type === typeFilter) &&
            (sizeFilter === '' || item.size.toLowerCase().includes(sizeFilter.toLowerCase())) &&
            (conditionFilter === '' || item.condition === conditionFilter)
        );

        return filtered.sort((a, b) => {
            const aValue = sortBy === 'addedBy' ? a.addedBy.fullName : a[sortBy];
            const bValue = sortBy === 'addedBy' ? b.addedBy.fullName : b[sortBy];
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    }, [uniforms, typeFilter, sizeFilter, conditionFilter, sortBy, sortOrder]);

    const SortableHeader = ({ sortKey, label }: { sortKey: SortKey, label: string }) => (
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
            <button onClick={() => handleSort(sortKey)} className="flex items-center space-x-1">
                <span>{label}</span>
                {sortBy === sortKey && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
            </button>
        </th>
    );

    return (
        <UserLayout pageTitle="Uniform Store">
            <AddUniformModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => mutate('/api/uniforms')} />
            
            <div className="p-4 mb-6 bg-white rounded-lg shadow print-layout-hidden">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* Filters */}
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Filter by Type...</option>
                        {Object.entries(uniformTypeMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                    </select>
                    <input type="text" placeholder="Filter by Size..." value={sizeFilter} onChange={e => setSizeFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Filter by Condition...</option>
                        {Object.entries(uniformConditionMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                    </select>
                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => window.print()} className="px-4 py-2 font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600">Print</button>
                        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light">Add Item</button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow printable-area">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <SortableHeader sortKey="type" label="Type" />
                            <SortableHeader sortKey="size" label="Size" />
                            <SortableHeader sortKey="condition" label="Condition" />
                            <SortableHeader sortKey="addedBy" label="Added By" />
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase print-layout-hidden">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={5} className="py-4 text-center text-gray-500">Loading...</td></tr>}
                        {filteredAndSortedUniforms.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{uniformTypeMap[item.type]}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.size}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{uniformConditionMap[item.condition]}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.addedBy.fullName}</td>
                                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap print-layout-hidden">
                                    {confirmingDeleteId === item.id ? (
                                        <div className="flex items-center justify-end space-x-2">
                                            <span className="text-sm text-gray-600">Are you sure?</span>
                                            <button onClick={() => executeDelete(item.id)} className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Yes</button>
                                            <button onClick={() => setConfirmingDeleteId(null)} className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">No</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmingDeleteId(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <style jsx global>{`
                @media print {
                    body { background-color: white !important; }
                    .print-layout-hidden { display: none !important; }
                    .printable-area { box-shadow: none !important; border: none !important; }
                    @page { size: landscape; }
                }
            `}</style>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session) { return { redirect: { destination: '/auth/signin', permanent: false } }; }
    return { props: {} };
};
