import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Define public vs protected paths
    const isPublicPath = path.startsWith('/auth');
    const isProtectedPath = path.startsWith('/dashboard') || path.startsWith('/meeting');

    const token = request.cookies.get("token")?.value;

    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedPath && !token) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    
    return NextResponse.next();
}

// NextJS expects this specific export name or default
export default proxy;

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/meeting/:path*',
        '/auth/:path*',
    ]
}
