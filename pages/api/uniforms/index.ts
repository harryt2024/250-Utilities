import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Handle GET request to fetch all uniform items
  if (req.method === 'GET') {
    try {
      const uniforms = await prisma.uniformItem.findMany({
        include: {
          addedBy: { select: { fullName: true } },
        },
        orderBy: {
          addedAt: 'desc',
        },
      });
      return res.status(200).json(uniforms);
    } catch (error) {
      console.error('Failed to fetch uniform items:', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  // Handle POST request to create a new uniform item
  else if (req.method === 'POST') {
    const { type, size, condition, quantity } = req.body;
    const numQuantity = parseInt(quantity) || 1;

    if (!type || !size || !condition) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
      // Create an array of items to be created
      const itemsToCreate = Array.from({ length: numQuantity }, () => ({
        type,
        size,
        condition,
        addedById: parseInt(session.user.id),
      }));

      // Use createMany for efficient bulk insertion
      await prisma.uniformItem.createMany({
        data: itemsToCreate,
      });
      
      return res.status(201).json({ message: `${numQuantity} item(s) created successfully.` });
    } catch (error) {
      console.error('Failed to create uniform item(s):', error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
