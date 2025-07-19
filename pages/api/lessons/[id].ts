import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const lessonId = req.query.id as string;

  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // --- Handle GET request to fetch lesson details and all users ---
  if (req.method === 'GET') {
    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(lessonId) },
        include: {
          assignments: {
            include: { user: { select: { id: true, fullName: true } } },
          },
        },
      });

      if (!lesson) return res.status(404).json({ message: 'Lesson not found.' });

      const allUsers = await prisma.user.findMany({
        select: { id: true, fullName: true },
        orderBy: { fullName: 'asc' },
      });

      return res.status(200).json({ lesson, allUsers });

    } catch (error) {
      console.error('Failed to fetch lesson details:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // --- Handle POST request to assign a user to a lesson ---
  else if (req.method === 'POST') {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required.' });
    try {
      await prisma.lessonAssignment.create({
        data: {
          lessonId: parseInt(lessonId),
          userId: parseInt(userId),
        },
      });
      return res.status(201).json({ message: 'User assigned successfully.' });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
         return res.status(409).json({ message: 'User is already assigned to this lesson.' });
      }
      console.error('Failed to assign user:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // --- Handle DELETE request to unassign a user from a lesson ---
  else if (req.method === 'DELETE') {
    const { userId } = req.body;
     if (!userId) return res.status(400).json({ message: 'User ID is required.' });
    try {
      await prisma.lessonAssignment.delete({
        where: {
          lessonId_userId: {
            lessonId: parseInt(lessonId),
            userId: parseInt(userId),
          },
        },
      });
      return res.status(200).json({ message: 'User unassigned successfully.' });
    } catch (error) {
      console.error('Failed to unassign user:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // --- Handle PUT request to update lesson details ---
  else if (req.method === 'PUT') {
    const { title, description, lessonDate } = req.body;
    if (!title || !lessonDate) {
        return res.status(400).json({ message: 'Title and date are required.' });
    }
    try {
        const updatedLesson = await prisma.lesson.update({
            where: { id: parseInt(lessonId) },
            data: {
                title,
                description,
                lessonDate: new Date(lessonDate),
            }
        });
        return res.status(200).json(updatedLesson);
    } catch (error) {
        console.error('Failed to update lesson:', error);
        return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
