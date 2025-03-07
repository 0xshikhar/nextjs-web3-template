// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifySignature } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, signature } = req.body;

        // Verify signature
        const fields = await verifySignature(message, signature);
        const { address } = fields;

        // Find or create user in database
        const user = await prisma.user.upsert({
            where: { walletAddress: address },
            update: { lastLoginAt: new Date() },
            create: {
                walletAddress: address,
                lastLoginAt: new Date()
            }
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, address },
            process.env.JWT_SECRET!,
            { expiresIn: '24h' }
        );

        return res.status(200).json({ token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
}
