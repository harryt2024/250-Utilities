import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const absenceId = req.query.id as string;

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Find the absence to ensure the user owns it
  const absence = await prisma.absence.findUnique({
    where: { id: parseInt(absenceId) },
  });

  if (!absence || absence.userId !== parseInt(session.user.id)) {
    // Also allow admins to modify any absence
    if (session.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'You do not have permission to modify this absence.' });
    }
  }

  // Handle PUT request to update an absence
  if (req.method === 'PUT') {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start and end dates are required.' });
    }
    try {
      const updatedAbsence = await prisma.absence.update({
        where: { id: parseInt(absenceId) },
        data: { startDate: new Date(startDate), endDate: new Date(endDate), reason },
      });
      return res.status(200).json(updatedAbsence);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // Handle DELETE request to remove an absence
  else if (req.method === 'DELETE') {
    try {
      await prisma.absence.delete({
        where: { id: parseInt(absenceId) },
      });
      return res.status(200).json({ message: 'Absence deleted successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
