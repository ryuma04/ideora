import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Define public vs protected paths
    const isPublicPath = path.startsWith('/auth');
    const isProtectedPath = path.startsWith('/dashboard') || path.startsWith('/meeting');

    const token = request.cookies.get("token")?.value;
    console.log(`proxy.ts: Path=${path}, Token Present=${!!token}`);

    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedPath && !token) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect authenticated users trying to access auth routes (login/signup)
    // Removed to prevent redirect loops when token is expired but still present in cookies
    /*
    if (isPublicPath && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    */
    
    return NextResponse.next();
}

export const config = {
    // Standard matcher for protected and auth routes
    matcher: [
        '/dashboard/:path*',
        '/meeting/:path*',
        '/auth/:path*',
    ]
}
