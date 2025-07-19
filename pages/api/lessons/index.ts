import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]"; // Import authOptions
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Use the more reliable `getServerSession` for server-side authentication
  const session = await getServerSession(req, res, authOptions);

  // Protect the route: only admins can access
  if (!session || session.user.role !== Role.ADMIN) {
    console.error('Authentication failed. Session missing or user is not an admin.');
    return res.status(401).json({ message: 'Unauthorized. Please sign in as an admin.' });
  }

  // Handle GET request to fetch all lessons
  if (req.method === 'GET') {
    try {
      const lessons = await prisma.lesson.findMany({
        include: {
          createdBy: { select: { fullName: true } },
          _count: { select: { assignments: true } }
        },
        orderBy: { lessonDate: 'desc' },
      });
      return res.status(200).json(lessons);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } 
  // Handle POST request to create a new lesson
  else if (req.method === 'POST') {
    const { title, description, lessonDate } = req.body;

    if (!title || !lessonDate) {
        return res.status(400).json({ message: 'Title and date are required.' });
    }

    try {
        const lesson = await prisma.lesson.create({
            data: {
                title,
                description,
                lessonDate: new Date(lessonDate),
                createdById: parseInt(session.user.id),
            }
        });
        return res.status(201).json(lesson);
    } catch (error) {
        console.error('Failed to create lesson:', error);
        return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
