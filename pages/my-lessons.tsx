import { getSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import useSWR from 'swr';
import type { Lesson, LessonResource, LessonAssignment, User } from '@prisma/client';
import UserLayout from '../components/UserLayout';
import { BookOpen, Download, Users } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type MyLessonData = (Lesson & {
    resources: LessonResource[];
    assignments: (LessonAssignment & { user: { fullName: string } })[];
});

export default function MyLessonsPage() {
    const { data: lessons, error, isLoading } = useSWR<MyLessonData[]>('/api/rota/my-lessons', fetcher);

    return (
        <UserLayout pageTitle="My Assigned Lessons">
            <div className="space-y-6">
                {isLoading && <p className="text-center text-gray-500">Loading your lessons...</p>}
                {error && <p className="text-center text-red-500">Failed to load lessons. Please try again later.</p>}
                
                {Array.isArray(lessons) && lessons.length === 0 && (
                    <div className="p-6 text-center bg-white rounded-lg shadow">
                        <h3 className="text-lg font-semibold text-gray-700">No Lessons Assigned</h3>
                        <p className="mt-1 text-gray-500">You have not been assigned to any lessons yet.</p>
                    </div>
                )}

                {Array.isArray(lessons) && lessons.map(lesson => (
                    <div key={lesson.id} className="p-6 bg-white rounded-lg shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    {new Date(lesson.lessonDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-gray-800">{lesson.title}</h2>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                                    {lesson.assignments.length} NCO(s) Assigned
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Other NCOs */}
                                <div>
                                    <h3 className="flex items-center text-sm font-semibold text-gray-600">
                                        <Users className="w-4 h-4 mr-2" /> Other Assigned NCOs
                                    </h3>
                                    <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                                        {lesson.assignments.map(a => <li key={a.userId}>{a.user.fullName}</li>)}
                                    </ul>
                                </div>
                                {/* Resources */}
                                <div>
                                    <h3 className="flex items-center text-sm font-semibold text-gray-600">
                                        <BookOpen className="w-4 h-4 mr-2" /> Lesson Resources
                                    </h3>
                                    <ul className="mt-2 space-y-2">
                                        {lesson.resources.length > 0 ? lesson.resources.map(res => (
                                            <li key={res.id}>
                                                <a href={res.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-portal-blue hover:underline">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {res.fileName}
                                                </a>
                                            </li>
                                        )) : <p className="text-sm text-gray-500">No resources uploaded.</p>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </UserLayout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context);
    if (!session) {
        return {
            redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        };
    }
    return { props: {} };
};
