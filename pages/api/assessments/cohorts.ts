import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role, AssessmentType } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // Any logged-in user can view cohorts
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      const cohorts = await prisma.assessmentCohort.findMany({
        include: {
          _count: {
            select: { assessments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(cohorts);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'POST') {
    // Only admins can create cohorts
    if (session.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: 'You do not have permission to create a cohort.' });
    }
    const { name, type, instructorName, instructorSqn, assessorName, assessorSqn } = req.body;
    if (!name || !type || !instructorName || !instructorSqn || !assessorName || !assessorSqn) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
      const cohort = await prisma.assessmentCohort.create({
        data: { name, type, instructorName, instructorSqn, assessorName, assessorSqn },
      });
      return res.status(201).json(cohort);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}