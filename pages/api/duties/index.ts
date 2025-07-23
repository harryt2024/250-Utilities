import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role, DutyStatus } from '@prisma/client';

const prisma = new PrismaClient();

function toUTCDate(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      const duties = await prisma.dutyRota.findMany({
        include: {
          actualSenior: { select: { fullName: true } },
          actualJunior: { select: { fullName: true } },
          originalSenior: { select: { fullName: true } },
          originalJunior: { select: { fullName: true } },
        },
        orderBy: { dutyDate: 'desc' },
      });
      return res.status(200).json(duties);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'POST') {
    const { dutyDate, originalSeniorId, originalJuniorId, actualSeniorId, actualJuniorId, seniorStatus, juniorStatus } = req.body;
    
    if (!dutyDate || !actualSeniorId || !actualJuniorId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      const date = toUTCDate(dutyDate);
      const duty = await prisma.dutyRota.upsert({
        where: { dutyDate: date },
        update: {
          actualSeniorId: parseInt(actualSeniorId),
          actualJuniorId: parseInt(actualJuniorId),
          seniorStatus: seniorStatus,
          juniorStatus: juniorStatus,
        },
        create: {
          dutyDate: date,
          originalSeniorId: parseInt(originalSeniorId || actualSeniorId),
          originalJuniorId: parseInt(originalJuniorId || actualJuniorId),
          actualSeniorId: parseInt(actualSeniorId),
          actualJuniorId: parseInt(actualJuniorId),
          seniorStatus: seniorStatus,
          juniorStatus: juniorStatus,
        },
      });
      return res.status(200).json(duty);
    } catch (error) {
      console.error("Error saving duty:", error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'DELETE') {
    const { dutyDate } = req.body;
    if (!dutyDate) {
        return res.status(400).json({ message: 'Date is required.' });
    }
    try {
        await prisma.dutyRota.delete({
            where: { dutyDate: toUTCDate(dutyDate) },
        });
        return res.status(200).json({ message: 'Assignment deleted.' });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}