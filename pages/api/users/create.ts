import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs'; 

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // Use the more reliable server-side session check
  const session = await getServerSession(req, res, authOptions);

  // 1. Authenticate & Authorize
  if (!session || session.user.role !== Role.ADMIN) {
    return res.status(401).json({ message: 'You are not authorized to perform this action.' });
  }

  // 2. Handle POST request
  if (req.method === 'POST') {
    const { fullName, username, password, role } = req.body;

    // 3. Validate input
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try {
      // 4. Check for existing user
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return res.status(409).json({ message: 'Username already taken.' });
      }

      // 5. Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          fullName,
          username,
          password: hashedPassword,
          role,
        },
      });

      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);

    } catch (error) {
      console.error('Request error', error);
      res.status(500).json({ error: 'Error creating user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
