import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
// FIX: Corrected the import path to be one level up
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const uniformId = req.query.id as string;

  // Allow any authenticated user to delete items
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.uniformItem.delete({
        where: { id: parseInt(uniformId) },
      });
      return res.status(200).json({ message: 'Uniform item deleted successfully.' });
    } catch (error) {
      console.error('Failed to delete uniform item:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
