import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs'; // <-- FIX: Use bcryptjs instead of bcrypt

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userId = req.query.id as string;

  // Authenticate and Authorize: Ensure user is an admin
  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // --- Handle PUT request to update user details (fullName, role) ---
  if (req.method === 'PUT') {
    const { fullName, role } = req.body;

    if (!fullName || !role) {
      return res.status(400).json({ message: 'Full name and role are required.' });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { fullName, role },
      });
      const { password: _, ...safeUser } = updatedUser;
      return res.status(200).json(safeUser);
    } catch (error) {
      console.error('Failed to update user details:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // --- Handle PATCH request to update user password ---
  else if (req.method === 'PATCH') {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try {
      // Use bcryptjs for hashing
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { password: hashedPassword },
      });
      return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
      console.error('Failed to update password:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // --- Handle other methods ---
  else {
    res.setHeader('Allow', ['PUT', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
