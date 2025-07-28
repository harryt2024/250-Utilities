import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const cohortId = req.query.id as string;

  // Any logged-in user can view a cohort's details
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      const cohort = await prisma.assessmentCohort.findUnique({
        where: { id: parseInt(cohortId) },
        include: {
          assessments: {
            include: { cadet: true },
            orderBy: { cadet: { fullName: 'asc' } },
          },
        },
      });
      if (!cohort) return res.status(404).json({ message: 'Cohort not found.' });
      return res.status(200).json(cohort);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  
  // Only admins can add or remove cadets
  if (session.user.role !== Role.ADMIN) {
    return res.status(403).json({ message: 'You do not have permission to modify this cohort.' });
  }

  if (req.method === 'POST') {
    const { sqn, rank, fullName } = req.body;
    if (!sqn || !rank || !fullName) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      const newAssessment = await prisma.$transaction(async (tx) => {
        const newCadet = await tx.cadet.create({
            data: { sqn, rank, fullName, serial: null }
        });
        const assessment = await tx.radioAssessment.create({
            data: {
                cohortId: parseInt(cohortId),
                cadetId: newCadet.id,
            }
        });
        return assessment;
      });
      return res.status(201).json(newAssessment);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'DELETE') {
    const { assessmentId } = req.body;
    try {
      await prisma.radioAssessment.delete({
        where: { id: parseInt(assessmentId) },
      });
      return res.status(200).json({ message: 'Cadet removed from cohort.' });
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}