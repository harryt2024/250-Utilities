import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Any authenticated user can view the rota
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch all lessons
      const lessons = await prisma.lesson.findMany({
        select: { id: true, title: true, lessonDate: true }
      });

      // Fetch all duty assignments
      const duties = await prisma.dutyRota.findMany({
        include: {
          dutySenior: { select: { fullName: true } },
          dutyJunior: { select: { fullName: true } },
        }
      });

      // Combine and format the data for the calendar
      const lessonEvents = lessons.map(lesson => ({
        title: lesson.title,
        start: lesson.lessonDate,
        end: lesson.lessonDate,
        type: 'lesson', // Add a type for styling
      }));

      const dutyEvents = duties.map(duty => ({
        title: `DS: ${duty.dutySenior.fullName}\nDJ: ${duty.dutyJunior.fullName}`,
        start: duty.dutyDate,
        end: duty.dutyDate,
        type: 'duty', // Add a type for styling
      }));

      const allEvents = [...lessonEvents, ...dutyEvents];

      return res.status(200).json(allEvents);

    } catch (error) {
      console.error('Failed to fetch rota data:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
