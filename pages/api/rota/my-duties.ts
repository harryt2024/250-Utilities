import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
// FIX: Corrected the import path to be one level up.
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
      const userId = parseInt(session.user.id);

      // Fetch all duties where the user is either the senior or junior
      const myDuties = await prisma.dutyRota.findMany({
        where: {
          OR: [
            { dutySeniorId: userId },
            { dutyJuniorId: userId },
          ],
        },
        include: {
          dutySenior: { select: { fullName: true } },
          dutyJunior: { select: { fullName: true } },
        },
        orderBy: {
          dutyDate: 'asc', // Show upcoming duties first
        },
      });

      // Add a 'role' to each duty object to show what the user's role was
      const dutiesWithRole = myDuties.map(duty => ({
        ...duty,
        userDuty: duty.dutySeniorId === userId ? 'Duty Senior' : 'Duty Junior',
      }));

      return res.status(200).json(dutiesWithRole);

    } catch (error) {
      console.error('Failed to fetch user duties:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
