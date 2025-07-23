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
      const userId = parseInt(session.user.id);

      const assignments = await prisma.lessonAssignment.findMany({
        where: { userId: userId },
        include: {
          lesson: {
            include: {
              resources: true,
              assignments: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
        },
        orderBy: {
          lesson: {
            lessonDate: 'asc',
          },
        },
      });

      // Extract just the lesson data from the assignments
      const lessons = assignments.map(a => a.lesson);

      return res.status(200).json(lessons);

    } catch (error) {
      console.error('Failed to fetch user lessons:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
