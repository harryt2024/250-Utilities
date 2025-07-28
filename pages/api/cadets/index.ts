import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      const cadets = await prisma.cadet.findMany({ orderBy: { fullName: 'asc' } });
      return res.status(200).json(cadets);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'POST') {
    // Only admins can create new cadets
    if (session.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: 'Forbidden.' });
    }
    const { serial, sqn, rank, fullName } = req.body;
    if (!serial || !sqn || !rank || !fullName) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      const cadet = await prisma.cadet.create({ data: { serial, sqn, rank, fullName } });
      return res.status(201).json(cadet);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}