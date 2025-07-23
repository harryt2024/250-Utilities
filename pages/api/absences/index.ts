import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      const absences = await prisma.absence.findMany({
        include: {
          user: { select: { fullName: true } },
        },
      });
      return res.status(200).json(absences);
    } catch (error) {
      console.error('Failed to fetch absences:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'POST') {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required.' });
    }

    try {
      const absence = await prisma.absence.create({
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason,
          userId: parseInt(session.user.id),
        },
      });
      return res.status(201).json(absence);
    } catch (error) {
      console.error('Failed to create absence:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}