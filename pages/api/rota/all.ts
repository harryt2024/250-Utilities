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
      const lessons = await prisma.lesson.findMany({
        select: { id: true, title: true, lessonDate: true }
      });

      const duties = await prisma.dutyRota.findMany({
        include: {
          // FIX: Use the new relation names
          actualSenior: { select: { fullName: true } },
          actualJunior: { select: { fullName: true } },
        }
      });
      
      const absences = await prisma.absence.findMany({
        include: {
            user: { select: { fullName: true } },
        }
      });

      const lessonEvents = lessons.map(lesson => ({
        title: lesson.title,
        start: lesson.lessonDate,
        end: lesson.lessonDate,
        type: 'lesson',
      }));

      const dutyEvents = duties.map(duty => ({
        // FIX: Use the new relation names
        title: `DS: ${duty.actualSenior.fullName}\nDJ: ${duty.actualJunior.fullName}`,
        start: duty.dutyDate,
        end: duty.dutyDate,
        type: 'duty',
      }));

      const absenceEvents = absences.map(absence => ({
        title: `${absence.user.fullName} (Absent)`,
        start: absence.startDate,
        end: new Date(new Date(absence.endDate).getTime() + 86400000).toISOString().split('T')[0],
        type: 'absence',
      }));

      const allEvents = [...lessonEvents, ...dutyEvents, ...absenceEvents];

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
