import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient, Role } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Get the user's session to verify they are an admin
  const session = await getSession({ req });

  // Protect the route: only admins can access it
  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Handle GET request to fetch all users
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        // Select only the fields that are safe to display
        // IMPORTANT: Never send the password hash to the client
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          fullName: 'asc', // Order users alphabetically by name
        },
      });
      return res.status(200).json(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } else {
    // If the request method is not GET, return an error
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
