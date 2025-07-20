import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userIdToModify = parseInt(req.query.id as string);

  // Authenticate and Authorize: Ensure user is an admin
  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // --- Handle DELETE request to remove a user ---
  if (req.method === 'DELETE') {
    // Prevent a user from deleting their own account
    if (session.user.id === userIdToModify.toString()) {
        return res.status(403).json({ message: "You cannot delete your own account." });
    }
    try {
        // Use a transaction to perform multiple database operations safely.
        // If any operation fails, all of them will be rolled back.
        await prisma.$transaction(async (tx) => {
            // 1. Delete all lesson assignments for this user.
            await tx.lessonAssignment.deleteMany({
                where: { userId: userIdToModify },
            });

            // 2. Delete all duty rota entries where this user is either senior or junior.
            await tx.dutyRota.deleteMany({
                where: {
                    OR: [
                        { dutySeniorId: userIdToModify },
                        { dutyJuniorId: userIdToModify },
                    ],
                },
            });

            // 3. Now it's safe to delete the user.
            await tx.user.delete({
                where: { id: userIdToModify },
            });
        });

        return res.status(200).json({ message: 'User and all associated assignments have been deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete user:', error);
        return res.status(500).json({ message: 'Something went wrong during the deletion process.' });
    }
  }
  // --- Handle PUT request to update user details (fullName, role) ---
  else if (req.method === 'PUT') {
    const { fullName, role } = req.body;

    if (!fullName || !role) {
      return res.status(400).json({ message: 'Full name and role are required.' });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userIdToModify },
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
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: userIdToModify },
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
    res.setHeader('Allow', ['PUT', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
