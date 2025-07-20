import { getSession, useSession } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import { Role } from '@prisma/client';
import useSWR, { useSWRConfig } from 'swr';
import type { User } from '@prisma/client';
import { useState, FormEvent, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UserData = Pick<User, 'id' | 'username' | 'fullName' | 'role' | 'createdAt'>;

// --- Create User Modal Component ---
function CreateUserModal({ isOpen, onClose, onUserCreated }: { isOpen: boolean, onClose: () => void, onUserCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFullName('');
        setUsername('');
        setPassword('');
        setRole(Role.USER);
        setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, password, role }),
    });
    if (response.ok) {
      onUserCreated();
      onClose();
    } else {
      const data = await response.json();
      setError(data.message || 'Failed to create user.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="password" placeholder="Password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value={Role.USER}>User</option>
            <option value={Role.ADMIN}>Admin</option>
          </select>
          <div className="flex justify-end pt-2 space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light disabled:bg-blue-300">
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Edit User Modal Component ---
function EditUserModal({ user, onClose, onUserUpdated }: { user: UserData | null, onClose: () => void, onUserUpdated: () => void }) {
  const { data: session } = useSession();
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setRole(user.role);
      setError(null);
      setSuccess(null);
      setPassword('');
      setIsConfirmingDelete(false);
    }
  }, [user]);

  if (!user) return null;

  const isSelf = session?.user?.id === user.id.toString();

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, role }),
    });
    if (response.ok) {
      onUserUpdated();
      onClose();
    } else {
      const data = await response.json();
      setError(data.message || 'Failed to update details.');
    }
    setIsSubmitting(false);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      setSuccess('Password updated successfully!');
      setPassword('');
    } else {
      const data = await response.json();
      setError(data.message || 'Failed to update password.');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
    });
    if (response.ok) {
        onUserUpdated();
        onClose();
    } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete user.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Edit User: {user.username}</h2>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {success && <p className="mt-2 text-sm text-green-500">{success}</p>}
        
        <form onSubmit={handleDetailsSubmit} className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold border-b">User Details</h3>
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isSelf} className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100">
            <option value={Role.USER}>User</option>
            <option value={Role.ADMIN}>Admin</option>
          </select>
          <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 text-sm font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light disabled:bg-blue-300">
            {isSubmitting ? 'Saving...' : 'Save Details'}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold border-b">Change Password</h3>
          <input type="password" placeholder="New Password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-orange-300">
            {isSubmitting ? 'Saving...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6">
            <h3 className="text-lg font-semibold border-b">Delete User</h3>
            {isSelf ? (
                <p className="mt-2 text-sm text-gray-500">You cannot delete your own account.</p>
            ) : (
                <div className="mt-4">
                    {!isConfirmingDelete ? (
                        <button onClick={() => setIsConfirmingDelete(true)} className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                            Delete User
                        </button>
                    ) : (
                        <div className="p-4 text-center bg-red-50 rounded-md">
                            <p className="font-semibold text-red-800">Are you sure?</p>
                            <p className="text-sm text-red-700">This action cannot be undone.</p>
                            <div className="flex justify-center mt-4 space-x-4">
                                <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800">Confirm Delete</button>
                                <button onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="mt-6 text-right">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---
export default function UserManagementPage() {
  const { mutate } = useSWRConfig();
  const { data: users, error, isLoading } = useSWR<UserData[]>('/api/users', fetcher);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const handleUserCreatedOrUpdated = () => {
    mutate('/api/users');
  };

  return (
    <AdminLayout pageTitle="User Management">
      <CreateUserModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onUserCreated={handleUserCreatedOrUpdated}
      />
      <EditUserModal 
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdated={handleUserCreatedOrUpdated}
      />
      
      <div className="flex items-center justify-end pb-4 mb-4">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 font-medium text-white rounded-md bg-portal-blue hover:bg-portal-blue-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-portal-blue"
        >
          Create New User
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Full Name</th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Username</th>
              <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Role</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>}
            {error && <tr><td colSpan={4} className="px-6 py-4 text-center text-red-500">Failed to load users.</td></tr>}
            {users?.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{user.fullName}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === Role.ADMIN
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                  <button onClick={() => setEditingUser(user)} className="text-portal-blue hover:text-portal-blue-light">
                    Edit
                  </button>
                </td>
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
    return {
      redirect: {
        destination: '/auth/signin?error=You are not authorized to view this page.',
        permanent: false,
      },
    };
  }
  return { props: {} };
};
