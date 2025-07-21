import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { getCsrfToken } from 'next-auth/react';

// This component renders the sign-in form
export default function SignIn({ csrfToken }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Use NextAuth's signIn function
    const result = await signIn('credentials', {
      redirect: false, // Do not redirect automatically, handle it manually
      username: username,
      password: password,
      callbackUrl: `${window.location.origin}/`, // Redirect all users to the main dashboard on success
    });

    if (result?.error) {
      // If there's an error, display it to the user
      setError('Invalid username or password. Please try again.');
      console.error('Sign-in error:', result.error);
    } else if (result?.ok) {
      // If sign-in is successful, redirect to the main dashboard
      router.push(result.url || '/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-portal-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">RAFAC Rota System</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {/* Display error message if sign-in fails */}
        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            <span className="font-medium">Login Failed!</span> {error}
          </div>
        )}
        
        {/* Sign-in form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* CSRF Token - hidden input required by NextAuth for security */}
          <input name="csrfToken" type="hidden" defaultValue={csrfToken ?? ''} />
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-portal-blue focus:border-portal-blue sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-portal-blue focus:border-portal-blue sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white rounded-md group bg-portal-blue hover:bg-portal-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-portal-blue"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// We need to get the CSRF token on the server and pass it to the page
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const csrfToken = await getCsrfToken(context) ?? null;
  return {
    props: { csrfToken },
  };
};
