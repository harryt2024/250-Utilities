import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Handle GET request to fetch all duty rota assignments
  if (req.method === 'GET') {
    try {
      const duties = await prisma.dutyRota.findMany({
        include: {
          dutySenior: { select: { fullName: true } },
          dutyJunior: { select: { fullName: true } },
        },
        orderBy: {
          dutyDate: 'desc',
        },
      });
      return res.status(200).json(duties);
    } catch (error) {
      console.error('Failed to fetch duties:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // Handle POST request to create or update a duty assignment
  else if (req.method === 'POST') {
    const { dutyDate, dutySeniorId, dutyJuniorId } = req.body;

    if (!dutyDate || !dutySeniorId || !dutyJuniorId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    if (dutySeniorId === dutyJuniorId) {
        return res.status(400).json({ message: 'Duty Senior and Duty Junior cannot be the same person.' });
    }

    try {
      // Use upsert to create a new entry or update an existing one for the same date
      const duty = await prisma.dutyRota.upsert({
        where: { dutyDate: new Date(dutyDate) },
        update: {
          dutySeniorId: parseInt(dutySeniorId),
          dutyJuniorId: parseInt(dutyJuniorId),
        },
        create: {
          dutyDate: new Date(dutyDate),
          dutySeniorId: parseInt(dutySeniorId),
          dutyJuniorId: parseInt(dutyJuniorId),
        },
      });
      return res.status(200).json(duty);
    } catch (error) {
      console.error('Failed to save duty assignment:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // Handle DELETE request to remove a duty assignment
  else if (req.method === 'DELETE') {
    const { dutyDate } = req.body;
    if (!dutyDate) {
        return res.status(400).json({ message: 'Date is required to delete an assignment.' });
    }
    try {
        await prisma.dutyRota.delete({
            where: { dutyDate: new Date(dutyDate) },
        });
        return res.status(200).json({ message: 'Duty assignment deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete duty assignment:', error);
        return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
