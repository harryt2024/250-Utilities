import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role, DutyStatus } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      // 1. Fetch all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
        },
      });

      // 2. Fetch all attended duties
      const attendedSeniorDuties = await prisma.dutyRota.groupBy({
        by: ['actualSeniorId'],
        where: { seniorStatus: DutyStatus.ATTENDED },
        _count: {
          actualSeniorId: true,
        },
      });

      const attendedJuniorDuties = await prisma.dutyRota.groupBy({
        by: ['actualJuniorId'],
        where: { juniorStatus: DutyStatus.ATTENDED },
        _count: {
          actualJuniorId: true,
        },
      });

      // 3. Map the counts to each user
      const stats = users.map(user => {
        const seniorCount = attendedSeniorDuties.find(d => d.actualSeniorId === user.id)?._count.actualSeniorId || 0;
        const juniorCount = attendedJuniorDuties.find(d => d.actualJuniorId === user.id)?._count.actualJuniorId || 0;
        return {
          id: user.id,
          fullName: user.fullName,
          seniorDuties: seniorCount,
          juniorDuties: juniorCount,
          totalDuties: seniorCount + juniorCount,
        };
      });

      return res.status(200).json(stats);

    } catch (error) {
      console.error('Failed to fetch duty stats:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}