import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress: address.toLowerCase() },
            select: { id: true }
        });

        return NextResponse.json({ exists: !!user });
    } catch (error) {
        console.error('Error checking user:', error);
        return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
    }
} 