import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to convert a YYYY-MM-DD string to a UTC Date object
function toUTCDate(dateString: string) {
    const date = new Date(dateString);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
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
          dutySenior: { select: { fullName: true } },
          dutyJunior: { select: { fullName: true } },
        },
        orderBy: {
          dutyDate: 'desc',
        },
      });
      return res.status(200).json(duties);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'POST') {
    const { dutyDate, dutySeniorId, dutyJuniorId } = req.body;

    if (!dutyDate || !dutySeniorId || !dutyJuniorId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    if (dutySeniorId === dutyJuniorId) {
        return res.status(400).json({ message: 'Duty Senior and Duty Junior cannot be the same person.' });
    }

    try {
      const date = toUTCDate(dutyDate);
      const duty = await prisma.dutyRota.upsert({
        where: { dutyDate: date },
        update: {
          dutySeniorId: parseInt(dutySeniorId),
          dutyJuniorId: parseInt(dutyJuniorId),
        },
        create: {
          dutyDate: date,
          dutySeniorId: parseInt(dutySeniorId),
          dutyJuniorId: parseInt(dutyJuniorId),
        },
      });
      return res.status(200).json(duty);
    } catch (error) {
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
