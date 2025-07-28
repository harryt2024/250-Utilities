import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient, AssessmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const criteriaKeys: (keyof import('@prisma/client').RadioAssessment)[] = [
    'firstClassLogbookCompleted', 'basicCyberSecurityVideoWatched', 'correctUseOfBothFullCallsigns',
    'authenticateRequested', 'authenticateAnsweredCorrectly', 'radioCheckRequested',
    'radioCheckAnsweredCorrectly', 'tacticalMessageFullyAnswered', 'iSayAgainUsedCorrectly',
    'sayAgainUsed', 'prowordKnowledgeCompletedOK', 'securityKnowledgeCompletedOK',
    'generalOperatingAndConfidence',
];

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const assessmentId = req.query.id as string;

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  if (req.method === 'GET') {
    try {
      const assessment = await prisma.radioAssessment.findUnique({
        where: { id: parseInt(assessmentId) },
        include: { cadet: true, cohort: true },
      });
      if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });
      return res.status(200).json(assessment);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else if (req.method === 'PUT') {
    const data = req.body;
    try {
      // First, update the specific criterion that was changed
      const updatedAssessment = await prisma.radioAssessment.update({
        where: { id: parseInt(assessmentId) },
        data: data,
      });

      // Now, re-calculate the overall pass/fail status
      let overallPass = true;
      for (const key of criteriaKeys) {
        if (updatedAssessment[key] === AssessmentStatus.FAIL) {
          overallPass = false;
          break; // One fail means an overall fail
        }
        if (updatedAssessment[key] === AssessmentStatus.PENDING) {
          overallPass = false; // If anything is pending, they haven't passed yet
        }
      }

      // Update the passFail field in the database
      const finalAssessment = await prisma.radioAssessment.update({
          where: { id: parseInt(assessmentId) },
          data: { passFail: overallPass },
      });

      return res.status(200).json(finalAssessment);
    } catch (error) {
      console.error("Error updating assessment:", error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}