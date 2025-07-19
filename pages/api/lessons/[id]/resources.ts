import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient, Role } from '@prisma/client';
import { Formidable } from 'formidable';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Disable Next.js body parser for this route to allow formidable to handle the stream
export const config = {
    api: {
        bodyParser: false,
    },
};

const uploadDir = path.join(process.cwd(), 'public/uploads/lessons');

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    const lessonId = req.query.id as string;

    if (!session || session.user.role !== Role.ADMIN) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    // Ensure the upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    if (req.method === 'POST') {
        const form = new Formidable({ uploadDir, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Formidable error:', err);
                return res.status(500).json({ message: 'Error parsing form data.' });
            }

            const file = files.file?.[0];
            if (!file) {
                return res.status(400).json({ message: 'No file uploaded.' });
            }

            try {
                const resource = await prisma.lessonResource.create({
                    data: {
                        lessonId: parseInt(lessonId),
                        fileName: file.originalFilename || 'Untitled',
                        filePath: `/uploads/lessons/${file.newFilename}`, // Public path to the file
                    },
                });
                return res.status(201).json(resource);
            } catch (dbError) {
                console.error('Database error:', dbError);
                return res.status(500).json({ message: 'Error saving file to database.' });
            }
        });
    } else if (req.method === 'DELETE') {
        const { resourceId } = req.body;
        if (!resourceId) {
            return res.status(400).json({ message: 'Resource ID is required.' });
        }
        try {
            // First, find the resource to get its file path
            const resource = await prisma.lessonResource.findUnique({
                where: { id: parseInt(resourceId) },
            });
            if (!resource) {
                return res.status(404).json({ message: 'Resource not found.' });
            }

            // Delete the file from the filesystem
            const filePath = path.join(process.cwd(), 'public', resource.filePath);
            await fs.unlink(filePath).catch(e => console.error("Failed to delete file, it may not exist:", e.message));

            // Delete the resource from the database
            await prisma.lessonResource.delete({
                where: { id: parseInt(resourceId) },
            });

            return res.status(200).json({ message: 'Resource deleted successfully.' });
        } catch (error) {
            console.error('Error deleting resource:', error);
            return res.status(500).json({ message: 'Something went wrong.' });
        }
    } else {
        res.setHeader('Allow', ['POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
