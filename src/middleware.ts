import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';

// Add paths that should be protected
const protectedPaths = [
    '/api/protected',
    '/api/user',
    // Add other protected API routes
];

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path should be protected
    if (protectedPaths.some(path => pathname.startsWith(path))) {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        try {
            // Verify the token
            const decoded = await verifyJwtToken(token);

            // Add user info to request headers to be accessible in route handlers
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-id', decoded.userId);
            requestHeaders.set('x-user-address', decoded.address);

            // Return the request with modified headers
            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

// Configure middleware to run only on API routes
export const config = {
    matcher: '/api/:path*',
}; 