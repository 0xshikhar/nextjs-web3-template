import { NextRequest, NextResponse } from 'next/server';

// Add paths that should be protected
const protectedPaths = [
    '/api/protected',
    '/api/user',
    '/api/auth/validate',
    // Add other protected API routes
];

// Add this list for paths that should bypass token verification
const publicPaths = [
    '/api/user/check',
    '/api/auth/login',
];

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Log the request path for debugging
    console.log(`Middleware processing: ${pathname}`);

    // Skip middleware for public paths
    if (publicPaths.some(path => pathname.startsWith(path))) {
        console.log(`Skipping middleware for public path: ${pathname}`);
        return NextResponse.next();
    }

    // Check if the path should be protected
    if (protectedPaths.some(path => pathname.startsWith(path))) {
        console.log(`Access granted to protected path: ${pathname}`);
        // Return the request without checking for a token
        return NextResponse.next();
    }

    return NextResponse.next();
}

// Configure middleware to run only on API routes
export const config = {
    matcher: '/api/:path*',
}; 