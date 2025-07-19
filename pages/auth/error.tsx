import { useRouter } from 'next/router';
import Link from 'next/link';

// A map of common NextAuth.js error codes to user-friendly messages.
const errors: { [key: string]: string } = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The token has expired or has already been used.',
  Default: 'An unknown error occurred.',
};

export default function AuthErrorPage() {
  const router = useRouter();
  // Get the error code from the URL query parameters
  const { error } = router.query;

  // Determine the error message to display
  const errorMessage = error && (errors[error as string] ?? errors.Default);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Authentication Error</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sorry, something went wrong during the authentication process.
          </p>
        </div>
        
        {/* Display the specific error message */}
        {errorMessage && (
            <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-300">
                <p>{errorMessage}</p>
            </div>
        )}

        <div>
          <Link href="/auth/signin" legacyBehavior>
            <a className="inline-block w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              &larr; Back to Sign In
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
