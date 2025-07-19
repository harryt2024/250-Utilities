import { getSession } from 'next-auth/react';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Role, PrismaClient, Lesson, User } from '@prisma/client';
import Link from 'next/link';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter } from 'next/router';
import { useState, useEffect, FormEvent } from 'react';

const prisma = new PrismaClient();
const fetcher = (url: string) => fetch(url).then((res) => res.json());

type LessonDetails = Lesson & {
    assignments: { user: { id: number; fullName: string; } }[];
};

type PageData = {
    lesson: LessonDetails;
    allUsers: User[];
};

export default function ManageLessonPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const router = useRouter();
    const { id } = router.query;
    const { mutate } = useSWRConfig();

    const { data, error } = useSWR<PageData>(`/api/lessons/${id}`, fetcher, { fallbackData: props as PageData});

    // State for editable lesson details
    const [title, setTitle] = useState(props.lesson.title);
    const [description, setDescription] = useState(props.lesson.description || '');
    const [lessonDate, setLessonDate] = useState(new Date(props.lesson.lessonDate).toISOString().split('T')[0]);
    
    // State for NCO assignment search
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (data) {
            setTitle(data.lesson.title);
            setDescription(data.lesson.description || '');
            setLessonDate(new Date(data.lesson.lessonDate).toISOString().split('T')[0]);
        }
    }, [data]);

    const handleDetailsUpdate = async (e: FormEvent) => {
        e.preventDefault();
        await fetch(`/api/lessons/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, lessonDate }),
        });
        mutate(`/api/lessons/${id}`);
    };

    const assignUser = async (userId: number) => {
        await fetch(`/api/lessons/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        mutate(`/api/lessons/${id}`);
    };

    const removeUser = async (userId: number) => {
        await fetch(`/api/lessons/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        mutate(`/api/lessons/${id}`);
    };

    if (error) return <div>Failed to load</div>;
    if (!data) return <div>Loading...</div>;

    const { lesson, allUsers } = data;
    const assignedUserIds = new Set(lesson.assignments.map(a => a.user.id));
    const filteredUsers = searchTerm
        ? allUsers.filter(user => 
            !assignedUserIds.has(user.id) && 
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="bg-white shadow-sm dark:bg-gray-800">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                         <Link href="/admin/lessons" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                            &larr; Back to All Lessons
                        </Link>
                        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Manage Lesson</h1>
                    </div>
                </div>
            </nav>

            <main className="py-10">
                <div className="grid grid-cols-1 gap-8 px-4 mx-auto max-w-7xl md:grid-cols-3 sm:px-6 lg:px-8">
                    {/* Left Column: Lesson Details & Assigned NCOs */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleDetailsUpdate} className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lesson Details</h2>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                    <input type="date" id="date" value={lessonDate} onChange={e => setLessonDate(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            <div className="mt-6 text-right">
                                <button type="submit" className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save Changes</button>
                            </div>
                        </form>

                        <div className="p-6 mt-8 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Currently Assigned NCOs</h3>
                            <ul className="mt-4 space-y-2">
                                {lesson.assignments.length > 0 ? lesson.assignments.map(assignment => (
                                    <li key={assignment.user.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md dark:bg-gray-700">
                                        <span className="text-gray-800 dark:text-gray-200">{assignment.user.fullName}</span>
                                        <button onClick={() => removeUser(assignment.user.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
                                    </li>
                                )) : <p className="text-gray-500 dark:text-gray-400">No NCOs assigned yet.</p>}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: NCO Search & Resources */}
                    <div>
                        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Assign NCOs</h3>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 mt-4 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
                            />
                            <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                                {filteredUsers.map(user => (
                                    <li key={user.id} onClick={() => assignUser(user.id)} className="p-2 text-gray-800 rounded-md cursor-pointer dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-900">
                                        {user.fullName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-6 mt-8 text-center bg-white rounded-lg shadow dark:bg-gray-800">
                            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Lesson Resources</h3>
                            <p className="text-gray-500 dark:text-gray-400">Resource upload functionality will be added here.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
        return { redirect: { destination: '/auth/signin', permanent: false } };
    }

    const lessonId = context.params?.id as string;

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: parseInt(lessonId) },
            include: {
                assignments: {
                    include: { user: { select: { id: true, fullName: true } } },
                },
            },
        });

        if (!lesson) return { notFound: true };

        const allUsers = await prisma.user.findMany({
            select: { id: true, fullName: true },
            orderBy: { fullName: 'asc' },
        });

        return { props: { lesson: JSON.parse(JSON.stringify(lesson)), allUsers } };
    } catch (error) {
        return { notFound: true };
    }
};
