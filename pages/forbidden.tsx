import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-portal-bg text-center">
      <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-4 text-lg text-gray-700">
        You do not have the necessary permissions to view this page.
      </p>
      <Link href="/" className="mt-8 px-6 py-2 font-medium text-white bg-portal-blue rounded-md hover:bg-portal-blue-light">
        Return to Home
      </Link>
    </div>
  );
}
